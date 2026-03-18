import { NextResponse } from 'next/server'
import { searchTasks, getLists, getFirstTask } from '../../../lib/rtm'
import { RTM_FILTERS } from '../../../lib/filters'
import { getProjectConfigs } from '../../../lib/projects'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch recently modified tasks, completed tasks, lists, and project configs
    const [modifiedTasks, completedTasks, lists, configs] = await Promise.all([
      searchTasks(RTM_FILTERS.recentlyModified, { cache: false }),
      searchTasks(RTM_FILTERS.completedToday, { cache: false }),
      getLists(),
      getProjectConfigs(),
    ])

    // Build list name lookup
    const listMap = new Map(lists.map((l) => [l.id, l.name]))

    // Build set of configured list IDs
    const configuredListIds = new Set<string>()
    const listNameToId = new Map(lists.map((l) => [l.name, l.id]))

    for (const config of configs) {
      if (!config.lists) continue
      for (const listName of Object.values(config.lists)) {
        if (listName) {
          const listId = listNameToId.get(listName)
          if (listId) {
            configuredListIds.add(listId)
          }
        }
      }
    }

    // Filter to configured lists only
    const filteredModified = modifiedTasks.filter((t) => t.list_id && configuredListIds.has(t.list_id))
    const filteredCompleted = completedTasks.filter((t) => t.list_id && configuredListIds.has(t.list_id))

    // Combine and dedupe by task ID
    const taskMap = new Map<string, {
      id: string
      name: string
      listId: string | null
      listName: string | null
      modified: string
      completed: string | null
      added: string
      priority: string
      activityType: 'completed' | 'modified' | 'added'
    }>()

    // Process completed tasks first (higher priority activity)
    for (const series of filteredCompleted) {
      const task = getFirstTask(series)
      if (!task) continue

      taskMap.set(series.id, {
        id: series.id,
        name: series.name,
        listId: series.list_id ?? null,
        listName: series.list_id ? listMap.get(series.list_id) ?? null : null,
        modified: series.modified,
        completed: task.completed ?? null,
        added: task.added ?? series.created,
        priority: task.priority ?? 'N',
        activityType: 'completed',
      })
    }

    // Process modified tasks
    for (const series of filteredModified) {
      if (taskMap.has(series.id)) continue // Skip if already added as completed

      const task = getFirstTask(series)
      if (!task) continue

      // Determine activity type based on timestamps
      const addedDate = new Date(task.added ?? series.created)
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const activityType = addedDate > oneDayAgo ? 'added' : 'modified'

      taskMap.set(series.id, {
        id: series.id,
        name: series.name,
        listId: series.list_id ?? null,
        listName: series.list_id ? listMap.get(series.list_id) ?? null : null,
        modified: series.modified,
        completed: null,
        added: task.added ?? series.created,
        priority: task.priority ?? 'N',
        activityType,
      })
    }

    // Convert to array and sort by most recent activity
    const activities = Array.from(taskMap.values()).sort((a, b) => {
      const timeA = a.completed
        ? new Date(a.completed).getTime()
        : new Date(a.modified).getTime()
      const timeB = b.completed
        ? new Date(b.completed).getTime()
        : new Date(b.modified).getTime()
      return timeB - timeA
    })

    // Limit to 20 most recent
    return NextResponse.json({
      activities: activities.slice(0, 20),
      count: activities.length,
    })
  } catch (error) {
    console.error('Activity fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
