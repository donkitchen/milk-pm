import { NextResponse } from 'next/server'
import { searchTasks, RTMTaskSeries, getFirstTask } from '../../../lib/rtm'
import { RTM_FILTERS } from '../../../lib/filters'

export interface DueGroup {
  label: string
  filter: string
  tasks: RTMTaskSeries[]
  count: number
}

export async function GET() {
  try {
    // Fetch all due categories in parallel
    const [overdueTasks, todayTasks, thisWeekTasks] = await Promise.all([
      searchTasks(RTM_FILTERS.overdue, { cache: false }),
      searchTasks(RTM_FILTERS.dueToday, { cache: false }),
      searchTasks(`dueAfter:today AND ${RTM_FILTERS.dueThisWeek}`, { cache: false }),
    ])

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

    const groups: DueGroup[] = [
      {
        label: 'Overdue',
        filter: RTM_FILTERS.overdue,
        tasks: sortByPriority(overdueTasks),
        count: overdueTasks.length,
      },
      {
        label: 'Due Today',
        filter: RTM_FILTERS.dueToday,
        tasks: sortByPriority(todayTasks),
        count: todayTasks.length,
      },
      {
        label: 'Due This Week',
        filter: RTM_FILTERS.dueThisWeek,
        tasks: sortByPriority(thisWeekTasks),
        count: thisWeekTasks.length,
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
