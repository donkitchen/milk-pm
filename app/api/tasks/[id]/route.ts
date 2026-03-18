import { NextResponse } from 'next/server'
import {
  searchTasks,
  getLists,
  getFirstTask,
  getTags,
  getNotes,
  setTaskName,
  setTaskPriority,
  setTaskDueDate,
  setTaskEstimate,
  setTaskURL,
  addTaskTags,
  removeTaskTags,
  addTaskNote,
  deleteTaskNote,
  completeTask,
  uncompleteTask,
} from '../../../../lib/rtm'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

// Helper to find a task by series ID
async function findTask(id: string) {
  const [tasks, lists] = await Promise.all([
    searchTasks(`status:incomplete OR status:completed`, { cache: false }),
    getLists(),
  ])

  const taskSeries = tasks.find((t) => t.id === id)
  if (!taskSeries) return null

  const task = getFirstTask(taskSeries)
  const listMap = new Map(lists.map((l) => [l.id, l.name]))

  return { taskSeries, task, listMap }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params

    const result = await findTask(id)
    if (!result) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const { taskSeries, task, listMap } = result
    const tags = getTags(taskSeries)
    const notes = getNotes(taskSeries)

    return NextResponse.json({
      task: {
        id: taskSeries.id,
        taskId: task?.id ?? null,
        listId: taskSeries.list_id ?? null,
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
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

interface UpdatePayload {
  name?: string
  priority?: string
  due?: string | null
  estimate?: string | null
  url?: string | null
  tags?: string[]
  completed?: boolean
  addNote?: { title: string; body: string }
  deleteNoteId?: string
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const body: UpdatePayload = await request.json()

    // Find the task first to get IDs
    const result = await findTask(id)
    if (!result) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const { taskSeries, task } = result
    const listId = taskSeries.list_id
    const taskId = task?.id

    if (!listId || !taskId) {
      return NextResponse.json({ error: 'Missing list or task ID' }, { status: 400 })
    }

    // Process updates
    const updates: Promise<void>[] = []

    if (body.name !== undefined && body.name !== taskSeries.name) {
      updates.push(setTaskName(listId, id, taskId, body.name))
    }

    if (body.priority !== undefined && body.priority !== task?.priority) {
      updates.push(setTaskPriority(listId, id, taskId, body.priority))
    }

    if (body.due !== undefined) {
      const currentDue = task?.due || null
      if (body.due !== currentDue) {
        updates.push(setTaskDueDate(listId, id, taskId, body.due ?? ''))
      }
    }

    if (body.estimate !== undefined) {
      const currentEstimate = task?.estimate || null
      if (body.estimate !== currentEstimate) {
        updates.push(setTaskEstimate(listId, id, taskId, body.estimate ?? ''))
      }
    }

    if (body.url !== undefined) {
      const currentUrl = taskSeries.url || null
      if (body.url !== currentUrl) {
        updates.push(setTaskURL(listId, id, taskId, body.url ?? ''))
      }
    }

    if (body.tags !== undefined) {
      const currentTags = getTags(taskSeries)
      const newTags = body.tags

      // Find tags to add and remove
      const toAdd = newTags.filter((t) => !currentTags.includes(t))
      const toRemove = currentTags.filter((t) => !newTags.includes(t))

      if (toAdd.length > 0) {
        updates.push(addTaskTags(listId, id, taskId, toAdd.join(',')))
      }
      if (toRemove.length > 0) {
        updates.push(removeTaskTags(listId, id, taskId, toRemove.join(',')))
      }
    }

    if (body.completed !== undefined) {
      const isCompleted = !!task?.completed
      if (body.completed && !isCompleted) {
        updates.push(completeTask(listId, id, taskId))
      } else if (!body.completed && isCompleted) {
        updates.push(uncompleteTask(listId, id, taskId))
      }
    }

    if (body.addNote) {
      await addTaskNote(listId, id, taskId, body.addNote.title, body.addNote.body)
    }

    if (body.deleteNoteId) {
      await deleteTaskNote(body.deleteNoteId)
    }

    // Execute all updates in parallel
    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Task update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 500 }
    )
  }
}
