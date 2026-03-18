import { NextResponse } from 'next/server'
import { searchTasks, getLists, getFirstTask, getTags, getNotes } from '../../../../lib/rtm'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params

    // Search for the task by ID
    // RTM doesn't have a direct "get task by ID" so we search and filter
    const [tasks, lists] = await Promise.all([
      searchTasks(`status:incomplete OR status:completed`, { cache: false }),
      getLists(),
    ])

    // Find the task with matching ID
    const taskSeries = tasks.find((t) => t.id === id)

    if (!taskSeries) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const task = getFirstTask(taskSeries)
    const listMap = new Map(lists.map((l) => [l.id, l.name]))
    const tags = getTags(taskSeries)
    const notes = getNotes(taskSeries)

    return NextResponse.json({
      task: {
        id: taskSeries.id,
        name: taskSeries.name,
        listName: taskSeries.list_id ? listMap.get(taskSeries.list_id) ?? null : null,
        priority: task?.priority ?? 'N',
        due: task?.due || null,
        completed: task?.completed || null,
        added: task?.added ?? taskSeries.created,
        tags,
        notes: notes.map((n) => ({
          id: n.id,
          title: n.title ?? '',
          body: n.$t ?? '',
        })),
        estimate: task?.estimate || null,
        url: taskSeries.url || null,
      },
    })
  } catch (error) {
    console.error('Task fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}
