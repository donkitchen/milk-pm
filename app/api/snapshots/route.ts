import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { getProjectConfigs } from '../../../lib/projects'
import { getTasksForList } from '../../../lib/rtm'

export const dynamic = 'force-dynamic'

// GET: Fetch snapshots for trends
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('project')
    const days = parseInt(searchParams.get('days') ?? '30', 10)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let query = supabase
      .from('task_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })

    if (projectSlug) {
      query = query.eq('project_slug', projectSlug)
    }

    const { data: snapshots, error } = await query

    if (error) {
      console.error('Snapshots fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 })
    }

    return NextResponse.json({ snapshots })
  } catch (error) {
    console.error('Snapshots error:', error)
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 })
  }
}

// POST: Create a snapshot for today
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all project configs for the user (RLS handles user filtering)
    const configs = await getProjectConfigs()
    const today = new Date().toISOString().split('T')[0]

    const snapshots = []

    for (const config of configs) {
      // Get task counts for each list
      let todoCount = 0
      let backlogCount = 0
      let bugsCount = 0

      if (config.lists?.todo) {
        try {
          const tasks = await getTasksForList(config.lists.todo)
          todoCount = Array.isArray(tasks) ? tasks.length : 0
        } catch (e) {
          console.error(`Failed to fetch todo for ${config.slug}:`, e)
        }
      }

      if (config.lists?.backlog) {
        try {
          const tasks = await getTasksForList(config.lists.backlog)
          backlogCount = Array.isArray(tasks) ? tasks.length : 0
        } catch (e) {
          console.error(`Failed to fetch backlog for ${config.slug}:`, e)
        }
      }

      if (config.lists?.bugs) {
        try {
          const tasks = await getTasksForList(config.lists.bugs)
          bugsCount = Array.isArray(tasks) ? tasks.length : 0
        } catch (e) {
          console.error(`Failed to fetch bugs for ${config.slug}:`, e)
        }
      }

      snapshots.push({
        user_id: user.id,
        project_slug: config.slug,
        snapshot_date: today,
        todo_count: todoCount,
        backlog_count: backlogCount,
        bugs_count: bugsCount,
        completed_today: 0, // Would need to track this separately
      })
    }

    // Upsert snapshots (update if exists for today)
    const { data, error } = await supabase
      .from('task_snapshots')
      .upsert(snapshots, {
        onConflict: 'user_id,project_slug,snapshot_date',
      })
      .select()

    if (error) {
      console.error('Snapshot upsert error:', error)
      return NextResponse.json({ error: 'Failed to create snapshots' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Created ${snapshots.length} snapshots`,
      snapshots: data,
    })
  } catch (error) {
    console.error('Snapshot creation error:', error)
    return NextResponse.json({ error: 'Failed to create snapshots' }, { status: 500 })
  }
}
