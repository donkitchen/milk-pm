import { NextResponse } from 'next/server'
import { searchTasks, getTags, getFirstTask, RTMTaskSeries } from '../../../lib/rtm'
import { getProjectConfigs } from '../../../lib/projects'
import { getStatusFromTags, BoardColumn, BOARD_COLUMNS } from '../../../lib/board'

export interface BoardTask {
  id: string // taskseries_id
  taskId: string // task_id
  listId: string
  name: string
  priority: string
  due: string | null
  tags: string[]
  status: BoardColumn
  projectSlug?: string
  projectName?: string
}

export interface BoardData {
  columns: Record<BoardColumn, BoardTask[]>
  projectFilter: string | null
}

// GET /api/board - Fetch all tasks grouped by status column
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('project')

    // Get all project configs to map list IDs to projects
    const configs = await getProjectConfigs()
    const listToProject = new Map<string, { slug: string; name: string }>()
    const configuredListIds = new Set<string>()

    for (const config of configs) {
      const listNames = Object.values(config.lists || {}).filter(Boolean)
      // We need to get list IDs - for now, store by name and match later
      for (const listName of listNames) {
        // We'll match by list_id from the tasks
      }
    }

    // Build list name to project mapping
    for (const config of configs) {
      for (const [_role, listName] of Object.entries(config.lists || {})) {
        if (listName) {
          listToProject.set(listName.toLowerCase(), { slug: config.slug, name: config.name })
        }
      }
    }

    // Search for all incomplete tasks
    // If project filter, search within that project's lists
    let filter = 'status:incomplete'
    const allTasks: RTMTaskSeries[] = await searchTasks(filter, { cache: false })

    // Also get recently completed tasks for the Done column (completed within last 7 days)
    const completedTasks = await searchTasks('status:completed AND completedWithin:"7 days"', { cache: false })

    // Combine and transform tasks
    const columns: Record<BoardColumn, BoardTask[]> = {
      inbox: [],
      todo: [],
      active: [],
      blocked: [],
      review: [],
      done: [],
    }

    // Process incomplete tasks
    for (const series of allTasks) {
      const tags = getTags(series)
      const status = getStatusFromTags(tags)
      const task = getFirstTask(series)

      // Skip if filtering by project and this task isn't in that project's lists
      // For now, include all tasks since we'd need list name mapping

      const boardTask: BoardTask = {
        id: series.id,
        taskId: task?.id ?? '',
        listId: series.list_id ?? '',
        name: series.name,
        priority: task?.priority ?? 'N',
        due: task?.due || null,
        tags,
        status,
      }

      columns[status].push(boardTask)
    }

    // Process completed tasks -> Done column
    for (const series of completedTasks) {
      const tags = getTags(series)
      const task = getFirstTask(series)

      const boardTask: BoardTask = {
        id: series.id,
        taskId: task?.id ?? '',
        listId: series.list_id ?? '',
        name: series.name,
        priority: task?.priority ?? 'N',
        due: task?.completed || null,
        tags,
        status: 'done',
      }

      columns.done.push(boardTask)
    }

    // Sort each column by priority, then due date
    const priorityOrder: Record<string, number> = { '1': 1, '2': 2, '3': 3, 'N': 4 }

    for (const column of BOARD_COLUMNS) {
      columns[column].sort((a, b) => {
        const pA = priorityOrder[a.priority] ?? 4
        const pB = priorityOrder[b.priority] ?? 4
        if (pA !== pB) return pA - pB

        if (a.due && b.due) return new Date(a.due).getTime() - new Date(b.due).getTime()
        if (a.due) return -1
        if (b.due) return 1
        return 0
      })
    }

    return NextResponse.json({
      columns,
      projectFilter: projectSlug,
    } as BoardData)
  } catch (error) {
    console.error('Failed to fetch board data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch board data' },
      { status: 500 }
    )
  }
}
