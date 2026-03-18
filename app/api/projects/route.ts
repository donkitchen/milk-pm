import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { getLists } from '../../../lib/rtm'
import { TABLE_PROJECT_CONFIGS } from '../../../lib/supabase/config'
import type { ProjectConfig } from '../../../lib/supabase/types'

export interface DiscoveredProject {
  slug: string
  name: string
  lists: {
    todo: string
    backlog: string
    bugs: string
    decisions: string
    context: string
  }
  enabled: boolean
  config: ProjectConfig | null
}

// GET: Discover all milk-mcp projects from RTM and merge with Supabase
export async function GET() {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch RTM lists and user's saved configs in parallel
    const [rtmLists, { data: savedConfigs }] = await Promise.all([
      getLists(),
      supabase
        .from(TABLE_PROJECT_CONFIGS)
        .select('*')
        .eq('user_id', user.id),
    ])

    const existingConfigs = savedConfigs ?? []

    // Find all lists matching "CC: * - TODO" pattern
    const todoLists = rtmLists.filter((l) =>
      /^CC:\s*.+\s*-\s*TODO$/i.test(l.name)
    )

    // Extract project names and build discovered projects
    const discovered: DiscoveredProject[] = todoLists.map((todoList) => {
      const match = todoList.name.match(/^CC:\s*(.+?)\s*-\s*TODO$/i)
      const projectName = match?.[1]?.trim() ?? todoList.name
      const slug = projectName.toLowerCase().replace(/\s+/g, '-')

      const existing = existingConfigs.find((c) => c.slug === slug)

      return {
        slug,
        name: projectName,
        lists: {
          todo: `CC: ${projectName} - TODO`,
          backlog: `CC: ${projectName} - Backlog`,
          bugs: `CC: ${projectName} - Bugs`,
          decisions: `CC: ${projectName} - Decisions`,
          context: `CC: ${projectName} - Context`,
        },
        enabled: !!existing,
        config: existing ?? null,
      }
    })

    // Sort: enabled first, then alphabetically
    discovered.sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ projects: discovered })
  } catch (error) {
    console.error('Failed to discover projects:', error)
    return NextResponse.json(
      { error: 'Failed to discover projects' },
      { status: 500 }
    )
  }
}

// POST: Save project configs to Supabase
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projects } = body as { projects: Omit<ProjectConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] }

    if (!Array.isArray(projects)) {
      return NextResponse.json({ error: 'Invalid projects array' }, { status: 400 })
    }

    // Delete all existing configs for this user
    await supabase
      .from(TABLE_PROJECT_CONFIGS)
      .delete()
      .eq('user_id', user.id)

    // Insert new configs
    if (projects.length > 0) {
      const { error } = await supabase
        .from(TABLE_PROJECT_CONFIGS)
        .insert(
          projects.map((p, index) => ({
            user_id: user.id,
            slug: p.slug,
            name: p.name,
            description: p.description || null,
            color: p.color,
            url: p.url || null,
            repo_url: p.repo_url || null,
            category: p.category || null,
            display_order: p.display_order ?? index,
            convention: p.convention || 'milk-mcp',
            lists: p.lists,
          }))
        )

      if (error) {
        console.error('Supabase insert error:', error)
        return NextResponse.json({ error: 'Failed to save projects' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save projects:', error)
    return NextResponse.json({ error: 'Failed to save projects' }, { status: 500 })
  }
}
