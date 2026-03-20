import { NextResponse } from 'next/server'
import { searchTasks, RTMTaskSeries, getFirstTask, getLists } from '../../../lib/rtm'
import { RTM_FILTERS } from '../../../lib/filters'
import { getProjectConfigs } from '../../../lib/projects'

export interface TaskWithMeta extends RTMTaskSeries {
  listName?: string
}

export interface TodayData {
  overdue: TaskWithMeta[]
  dueToday: TaskWithMeta[]
  completedToday: number
  totalToday: number
}

export async function GET() {
  try {
    // Get configured project lists to filter by
    const [configs, rtmLists] = await Promise.all([
      getProjectConfigs(),
      getLists(),
    ])

    // Build maps for list ID lookup
    const configuredListIds = new Set<string>()
    const listNameToId = new Map(rtmLists.map((l) => [l.name, l.id]))
    const listIdToName = new Map(rtmLists.map((l) => [l.id, l.name]))

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

    // Fetch all due categories in parallel
    const [overdueTasks, todayTasks, completedTodayTasks] = await Promise.all([
      searchTasks(RTM_FILTERS.overdue, { cache: false }),
      searchTasks(RTM_FILTERS.dueToday, { cache: false }),
      searchTasks(RTM_FILTERS.completedToday, { cache: false }),
    ])

    // Filter to only tasks in configured project lists
    const filterToConfiguredLists = (tasks: RTMTaskSeries[]) => {
      return tasks.filter((t) => t.list_id && configuredListIds.has(t.list_id))
    }

    // Add list name to tasks
    const addListName = (tasks: RTMTaskSeries[]): TaskWithMeta[] => {
      return tasks.map((t) => ({
        ...t,
        listName: t.list_id ? listIdToName.get(t.list_id) : undefined,
      }))
    }

    // Sort tasks by priority, then name
    const sortByPriorityAndName = (tasks: TaskWithMeta[]) => {
      return [...tasks].sort((a, b) => {
        const aTask = getFirstTask(a)
        const bTask = getFirstTask(b)
        const aPri = aTask?.priority === 'N' ? 4 : parseInt(aTask?.priority ?? '4')
        const bPri = bTask?.priority === 'N' ? 4 : parseInt(bTask?.priority ?? '4')
        if (aPri !== bPri) return aPri - bPri
        return a.name.localeCompare(b.name)
      })
    }

    const filteredOverdue = filterToConfiguredLists(overdueTasks)
    const filteredToday = filterToConfiguredLists(todayTasks)
    const filteredCompletedToday = filterToConfiguredLists(completedTodayTasks)

    const data: TodayData = {
      overdue: sortByPriorityAndName(addListName(filteredOverdue)),
      dueToday: sortByPriorityAndName(addListName(filteredToday)),
      completedToday: filteredCompletedToday.length,
      totalToday: filteredToday.length + filteredCompletedToday.length,
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch today tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today tasks' },
      { status: 500 }
    )
  }
}
