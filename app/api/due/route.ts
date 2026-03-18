import { NextResponse } from 'next/server'
import { searchTasks, RTMTaskSeries, getFirstTask, getLists } from '../../../lib/rtm'
import { RTM_FILTERS } from '../../../lib/filters'
import { getProjectConfigs } from '../../../lib/projects'

export interface DueGroup {
  label: string
  filter: string
  tasks: RTMTaskSeries[]
  count: number
}

export async function GET() {
  try {
    // Get configured project lists to filter by
    const [configs, rtmLists] = await Promise.all([
      getProjectConfigs(),
      getLists(),
    ])

    // Build a set of all configured list IDs
    const configuredListIds = new Set<string>()
    const listNameToId = new Map(rtmLists.map((l) => [l.name, l.id]))

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
    const [overdueTasks, todayTasks, thisWeekTasks] = await Promise.all([
      searchTasks(RTM_FILTERS.overdue, { cache: false }),
      searchTasks(RTM_FILTERS.dueToday, { cache: false }),
      searchTasks(`dueAfter:today AND ${RTM_FILTERS.dueThisWeek}`, { cache: false }),
    ])

    // Filter to only tasks in configured project lists
    const filterToConfiguredLists = (tasks: RTMTaskSeries[]) => {
      return tasks.filter((t) => t.list_id && configuredListIds.has(t.list_id))
    }

    // Sort tasks by priority within each group
    const sortByPriority = (tasks: RTMTaskSeries[]) => {
      return [...tasks].sort((a, b) => {
        const aTask = getFirstTask(a)
        const bTask = getFirstTask(b)
        const aPri = aTask?.priority === 'N' ? 4 : parseInt(aTask?.priority ?? '4')
        const bPri = bTask?.priority === 'N' ? 4 : parseInt(bTask?.priority ?? '4')
        return aPri - bPri
      })
    }

    const filteredOverdue = filterToConfiguredLists(overdueTasks)
    const filteredToday = filterToConfiguredLists(todayTasks)
    const filteredThisWeek = filterToConfiguredLists(thisWeekTasks)

    const groups: DueGroup[] = [
      {
        label: 'Overdue',
        filter: RTM_FILTERS.overdue,
        tasks: sortByPriority(filteredOverdue),
        count: filteredOverdue.length,
      },
      {
        label: 'Due Today',
        filter: RTM_FILTERS.dueToday,
        tasks: sortByPriority(filteredToday),
        count: filteredToday.length,
      },
      {
        label: 'Due This Week',
        filter: RTM_FILTERS.dueThisWeek,
        tasks: sortByPriority(filteredThisWeek),
        count: filteredThisWeek.length,
      },
    ]

    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Failed to fetch due tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch due tasks' },
      { status: 500 }
    )
  }
}
