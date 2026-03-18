import { NextResponse } from 'next/server'
import { addTask, completeTask, uncompleteTask } from '../../../lib/rtm'
import { revalidatePath } from 'next/cache'

// POST /api/tasks - Add a new task
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, listId } = body as { name: string; listId?: string }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Task name is required' },
        { status: 400 }
      )
    }

    // Add task using RTM's smart parsing
    const task = await addTask({
      name: name.trim(),
      listId,
      parse: true, // Enable smart parsing for dates, priorities, tags
    })

    // Revalidate pages that show tasks
    revalidatePath('/')
    if (listId) {
      revalidatePath(`/project/[slug]`)
    }

    return NextResponse.json({ task, success: true })
  } catch (error) {
    console.error('Failed to add task:', error)
    return NextResponse.json(
      { error: 'Failed to add task' },
      { status: 500 }
    )
  }
}

// PATCH /api/tasks - Complete or uncomplete a task
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { action, listId, taskseriesId, taskId } = body as {
      action: 'complete' | 'uncomplete'
      listId: string
      taskseriesId: string
      taskId: string
    }

    if (!listId || !taskseriesId || !taskId) {
      return NextResponse.json(
        { error: 'Missing required task identifiers' },
        { status: 400 }
      )
    }

    if (action === 'complete') {
      await completeTask(listId, taskseriesId, taskId)
    } else if (action === 'uncomplete') {
      await uncompleteTask(listId, taskseriesId, taskId)
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Revalidate pages
    revalidatePath('/')
    revalidatePath(`/project/[slug]`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
