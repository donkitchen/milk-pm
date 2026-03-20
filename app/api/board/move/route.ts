import { NextResponse } from 'next/server'
import { addTaskTags, removeTaskTags } from '../../../../lib/rtm'
import { revalidatePath } from 'next/cache'
import { BoardColumn, BOARD_COLUMNS, getStatusTag } from '../../../../lib/board'

// POST /api/board/move - Move a task to a new status column
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { listId, taskseriesId, taskId, fromStatus, toStatus } = body as {
      listId: string
      taskseriesId: string
      taskId: string
      fromStatus: BoardColumn
      toStatus: BoardColumn
    }

    if (!listId || !taskseriesId || !taskId) {
      return NextResponse.json(
        { error: 'Missing required task identifiers' },
        { status: 400 }
      )
    }

    if (!BOARD_COLUMNS.includes(fromStatus) || !BOARD_COLUMNS.includes(toStatus)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    if (fromStatus === toStatus) {
      return NextResponse.json({ success: true, message: 'No change needed' })
    }

    // Remove the old status tag (if not inbox - inbox has no tag by default)
    const oldTag = getStatusTag(fromStatus)
    if (fromStatus !== 'inbox') {
      try {
        await removeTaskTags(listId, taskseriesId, taskId, oldTag)
      } catch (err) {
        // Tag might not exist, continue anyway
        console.warn(`Could not remove tag ${oldTag}:`, err)
      }
    }

    // Add the new status tag (unless moving to inbox - inbox is the default)
    const newTag = getStatusTag(toStatus)
    if (toStatus !== 'inbox') {
      await addTaskTags(listId, taskseriesId, taskId, newTag)
    }

    // Revalidate pages
    revalidatePath('/')
    revalidatePath('/board')
    revalidatePath(`/project/[slug]`)

    return NextResponse.json({
      success: true,
      fromTag: oldTag,
      toTag: newTag,
    })
  } catch (error) {
    console.error('Failed to move task:', error)
    return NextResponse.json(
      { error: 'Failed to move task' },
      { status: 500 }
    )
  }
}
