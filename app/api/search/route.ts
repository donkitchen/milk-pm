import { NextResponse } from 'next/server'
import { searchTasks, RTMTaskSeries, getFirstTask, getLists } from '../../../lib/rtm'
import { buildSearchFilter } from '../../../lib/filters'

export interface SearchResult {
  task: RTMTaskSeries
  listName: string | null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const includeCompleted = searchParams.get('completed') === 'true'

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], query: '' })
    }

    // Build the search filter
    const filter = buildSearchFilter(query, includeCompleted)

    // Fetch tasks and lists in parallel
    const [tasks, lists] = await Promise.all([
      searchTasks(filter, { cache: false }),
      getLists(),
    ])

    // Build list name lookup
    const listMap = new Map(lists.map((l) => [l.id, l.name]))

    // Sort by priority, then by due date
    const sortedTasks = [...tasks].sort((a, b) => {
      const aTask = getFirstTask(a)
      const bTask = getFirstTask(b)

      // Priority first (1 > 2 > 3 > N)
      const aPri = aTask?.priority === 'N' ? 4 : parseInt(aTask?.priority ?? '4')
      const bPri = bTask?.priority === 'N' ? 4 : parseInt(bTask?.priority ?? '4')
      if (aPri !== bPri) return aPri - bPri

      // Then by due date (earlier first, no date last)
      const aDue = aTask?.due ? new Date(aTask.due).getTime() : Infinity
      const bDue = bTask?.due ? new Date(bTask.due).getTime() : Infinity
      return aDue - bDue
    })

    // Limit results and add list names
    const results: SearchResult[] = sortedTasks.slice(0, 20).map((task) => ({
      task,
      listName: task.list_id ? listMap.get(task.list_id) ?? null : null,
    }))

    return NextResponse.json({
      results,
      query,
      total: tasks.length,
    })
  } catch (error) {
    console.error('Search failed:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
