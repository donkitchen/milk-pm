'use client'

import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { BoardColumn, BOARD_COLUMNS, COLUMN_META } from '../lib/board'

interface BoardTask {
  id: string
  taskId: string
  listId: string
  name: string
  priority: string
  due: string | null
  tags: string[]
  status: BoardColumn
}

interface BoardData {
  columns: Record<BoardColumn, BoardTask[]>
}

const PRIORITY_COLOR: Record<string, string> = {
  '1': 'border-l-red-500',
  '2': 'border-l-yellow-500',
  '3': 'border-l-blue-500',
  'N': 'border-l-gray-200 dark:border-l-gray-700',
}

const PRIORITY_ICON: Record<string, string> = {
  '1': '🔴',
  '2': '🟡',
  '3': '🔵',
  'N': '',
}

function formatDue(due: string): { label: string; overdue: boolean } {
  const d = new Date(due)
  const now = new Date()
  const overdue = d < now
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { label, overdue }
}

export default function KanbanBoard() {
  const [data, setData] = useState<BoardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [moving, setMoving] = useState<string | null>(null) // task ID being moved

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch('/api/board')
      if (!res.ok) throw new Error('Failed to fetch board')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // Dropped outside a valid droppable
    if (!destination) return

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    if (!data) return

    const fromColumn = source.droppableId as BoardColumn
    const toColumn = destination.droppableId as BoardColumn
    const task = data.columns[fromColumn].find((t) => t.id === draggableId)

    if (!task) return

    // Optimistic update
    const newData = { ...data }
    const fromTasks = [...newData.columns[fromColumn]]
    const toTasks = fromColumn === toColumn ? fromTasks : [...newData.columns[toColumn]]

    // Remove from source
    const [movedTask] = fromTasks.splice(source.index, 1)
    movedTask.status = toColumn

    // Add to destination
    if (fromColumn === toColumn) {
      fromTasks.splice(destination.index, 0, movedTask)
      newData.columns[fromColumn] = fromTasks
    } else {
      toTasks.splice(destination.index, 0, movedTask)
      newData.columns[fromColumn] = fromTasks
      newData.columns[toColumn] = toTasks
    }

    setData(newData)

    // Only call API if column changed
    if (fromColumn !== toColumn) {
      setMoving(task.id)

      try {
        const res = await fetch('/api/board/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listId: task.listId,
            taskseriesId: task.id,
            taskId: task.taskId,
            fromStatus: fromColumn,
            toStatus: toColumn,
          }),
        })

        if (!res.ok) {
          // Revert on error
          await fetchBoard()
        }
      } catch {
        // Revert on error
        await fetchBoard()
      } finally {
        setMoving(null)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 dark:text-gray-500">Loading board...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
        {BOARD_COLUMNS.map((column) => {
          const meta = COLUMN_META[column]
          const tasks = data.columns[column]

          return (
            <div
              key={column}
              className={`flex-shrink-0 w-72 ${meta.color} rounded-lg flex flex-col`}
            >
              {/* Column header */}
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span>{meta.emoji}</span>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">
                    {meta.label}
                  </h3>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-gray-500 dark:text-gray-400">
                    {tasks.length}
                  </span>
                </div>
              </div>

              {/* Droppable area */}
              <Droppable droppableId={column}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 space-y-2 overflow-y-auto transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    {tasks.map((task, index) => {
                      const dueInfo = task.due ? formatDue(task.due) : null
                      const isMoving = moving === task.id

                      return (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white dark:bg-gray-900 rounded-md shadow-sm border-l-4 ${
                                PRIORITY_COLOR[task.priority]
                              } p-3 cursor-grab active:cursor-grabbing transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
                              } ${isMoving ? 'opacity-50' : ''}`}
                            >
                              {/* Task name */}
                              <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">
                                {task.name}
                              </p>

                              {/* Meta row */}
                              <div className="flex items-center gap-2 text-xs">
                                {PRIORITY_ICON[task.priority] && (
                                  <span>{PRIORITY_ICON[task.priority]}</span>
                                )}
                                {dueInfo && (
                                  <span
                                    className={
                                      dueInfo.overdue
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                    }
                                  >
                                    {dueInfo.label}
                                  </span>
                                )}
                              </div>

                              {/* Tags */}
                              {task.tags.filter((t) => !t.startsWith('s:')).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {task.tags
                                    .filter((t) => !t.startsWith('s:'))
                                    .slice(0, 3)
                                    .map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  {task.tags.filter((t) => !t.startsWith('s:')).length > 3 && (
                                    <span className="text-xs text-gray-400">
                                      +{task.tags.filter((t) => !t.startsWith('s:')).length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
