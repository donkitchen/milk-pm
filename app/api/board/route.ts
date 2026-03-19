import { NextResponse } from 'next/server'
import { searchTasks, getTags, getFirstTask, getLists, RTMTaskSeries } from '../../../lib/rtm'
import { getProjectConfigs, ListRole } from '../../../lib/projects'
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
  projectSlug: string | null
  projectName: string | null
  listRole: ListRole | null
}

export interface BoardData {
  columns: Record<BoardColumn, BoardTask[]>
  projects: Array<{ slug: string; name: string }>
}

// GET /api/board - Fetch all tasks grouped by status column
export async function GET() {
  try {
    // Get all project configs and RTM lists to build mappings
    const [configs, rtmLists] = await Promise.all([
      getProjectConfigs(),
      getLists(),
    ])

    // Build list name -> list ID mapping
    const listNameToId = new Map<string, string>()
    for (const list of rtmLists) {
      listNameToId.set(list.name.toLowerCase(), list.id)
    }

    // Build list ID -> project info mapping
    const listIdToProject = new Map<string, { slug: string; name: string; role: ListRole }>()
    for (const config of configs) {
      for (const [role, listName] of Object.entries(config.lists || {})) {
        if (listName) {
          const listId = listNameToId.get(listName.toLowerCase())
          if (listId) {
            listIdToProject.set(listId, {
              slug: config.slug,
              name: config.name,
              role: role as ListRole,
            })
          }
        }
      }
    }

    // Search for all incomplete tasks
    const allTasks: RTMTaskSeries[] = await searchTasks('status:incomplete', { cache: false })

    // Also get recently completed tasks for the Done column (completed within last 7 days)
    const completedTasks = await searchTasks('status:completed AND completedWithin:"7 days"', { cache: false })

    // Initialize columns
    const columns: Record<BoardColumn, BoardTask[]> = {
      inbox: [],
      todo: [],
      active: [],
      blocked: [],
      review: [],
      done: [],
    }

    // Track unique projects for the filter
    const projectsSet = new Map<string, string>()

    // Process incomplete tasks
    for (const series of allTasks) {
      const tags = getTags(series)
      const status = getStatusFromTags(tags)
      const task = getFirstTask(series)
      const listId = series.list_id ?? ''

      // Look up project info
      const projectInfo = listIdToProject.get(listId)

      // Only include tasks from configured project lists
      if (!projectInfo) continue

      projectsSet.set(projectInfo.slug, projectInfo.name)

      const boardTask: BoardTask = {
        id: series.id,
        taskId: task?.id ?? '',
        listId,
        name: series.name,
        priority: task?.priority ?? 'N',
        due: task?.due || null,
        tags,
        status,
        projectSlug: projectInfo.slug,
        projectName: projectInfo.name,
        listRole: projectInfo.role,
      }

      columns[status].push(boardTask)
    }

    // Process completed tasks -> Done column
    for (const series of completedTasks) {
      const tags = getTags(series)
      const task = getFirstTask(series)
      const listId = series.list_id ?? ''

      // Look up project info
      const projectInfo = listIdToProject.get(listId)

      // Only include tasks from configured project lists
      if (!projectInfo) continue

      projectsSet.set(projectInfo.slug, projectInfo.name)

      const boardTask: BoardTask = {
        id: series.id,
        taskId: task?.id ?? '',
        listId,
        name: series.name,
        priority: task?.priority ?? 'N',
        due: task?.completed || null,
        tags,
        status: 'done',
        projectSlug: projectInfo.slug,
        projectName: projectInfo.name,
        listRole: projectInfo.role,
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

    // Build projects list for grouping
    const projects = Array.from(projectsSet.entries()).map(([slug, name]) => ({
      slug,
      name,
    }))

    return NextResponse.json({
      columns,
      projects,
    } as BoardData)
  } catch (error) {
    console.error('Failed to fetch board data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch board data' },
      { status: 500 }
    )
  }
}
