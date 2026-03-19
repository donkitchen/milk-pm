'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { BoardColumn, BOARD_COLUMNS, COLUMN_META } from '../lib/board'
import { ListRole } from '../lib/projects'

interface BoardTask {
  id: string
  taskId: string
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

interface BoardData {
  columns: Record<BoardColumn, BoardTask[]>
  projects: Array<{ slug: string; name: string }>
}

type GroupBy = 'none' | 'project' | 'priority' | 'listType'

interface GroupInfo {
  key: string
  label: string
  emoji?: string
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

const PRIORITY_GROUPS: GroupInfo[] = [
  { key: '1', label: 'High Priority', emoji: '🔴' },
  { key: '2', label: 'Medium Priority', emoji: '🟡' },
  { key: '3', label: 'Low Priority', emoji: '🔵' },
  { key: 'N', label: 'No Priority', emoji: '⚪' },
]

const LIST_TYPE_META: Record<ListRole, { label: string; emoji: string }> = {
  todo: { label: 'Todo', emoji: '📋' },
  backlog: { label: 'Backlog', emoji: '📦' },
  bugs: { label: 'Bugs', emoji: '🐛' },
  decisions: { label: 'Decisions', emoji: '🎯' },
  context: { label: 'Context', emoji: '📝' },
}

function formatDue(due: string): { label: string; overdue: boolean } {
  const d = new Date(due)
  const now = new Date()
  const overdue = d < now
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { label, overdue }
}

function TaskCard({ task, isMoving }: { task: BoardTask; isMoving: boolean }) {
  const dueInfo = task.due ? formatDue(task.due) : null

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-md shadow-sm border-l-4 ${
        PRIORITY_COLOR[task.priority]
      } p-3 ${isMoving ? 'opacity-50' : ''}`}
    >
      {/* Project badge when not grouped by project */}
      {task.projectName && (
        <div className="text-xs text-gray-400 dark:text-gray-500 mb-1 truncate">
          {task.projectName}
        </div>
      )}

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
  )
}

export default function KanbanBoard() {
  const [data, setData] = useState<BoardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [moving, setMoving] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<GroupBy>('none')

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

  // Calculate groups based on groupBy selection
  const groups = useMemo((): GroupInfo[] => {
    if (!data) return []

    switch (groupBy) {
      case 'project':
        return data.projects.map((p) => ({
          key: p.slug,
          label: p.name,
        }))
      case 'priority':
        return PRIORITY_GROUPS
      case 'listType':
        // Get unique list types from tasks
        const listTypes = new Set<ListRole>()
        for (const column of BOARD_COLUMNS) {
          for (const task of data.columns[column]) {
            if (task.listRole) listTypes.add(task.listRole)
          }
        }
        return Array.from(listTypes).map((role) => ({
          key: role,
          label: LIST_TYPE_META[role].label,
          emoji: LIST_TYPE_META[role].emoji,
        }))
      default:
        return [{ key: 'all', label: 'All Tasks' }]
    }
  }, [data, groupBy])

  // Filter tasks for a specific group
  const getTasksForGroup = useCallback(
    (column: BoardColumn, groupKey: string): BoardTask[] => {
      if (!data) return []

      const tasks = data.columns[column]

      if (groupBy === 'none' || groupKey === 'all') {
        return tasks
      }

      return tasks.filter((task) => {
        switch (groupBy) {
          case 'project':
            return task.projectSlug === groupKey
          case 'priority':
            return task.priority === groupKey
          case 'listType':
            return task.listRole === groupKey
          default:
            return true
        }
      })
    },
    [data, groupBy]
  )

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    if (!data) return

    // Parse droppable IDs (format: "column" or "column:groupKey")
    const [fromColumn] = source.droppableId.split(':') as [BoardColumn]
    const [toColumn] = destination.droppableId.split(':') as [BoardColumn]

    const task = data.columns[fromColumn].find((t) => t.id === draggableId)
    if (!task) return

    // Optimistic update
    const newData = { ...data }
    const fromTasks = [...newData.columns[fromColumn]]
    const toTasks = fromColumn === toColumn ? fromTasks : [...newData.columns[toColumn]]

    const fromIndex = fromTasks.findIndex((t) => t.id === draggableId)
    const [movedTask] = fromTasks.splice(fromIndex, 1)
    movedTask.status = toColumn

    if (fromColumn === toColumn) {
      fromTasks.splice(destination.index, 0, movedTask)
      newData.columns[fromColumn] = fromTasks
    } else {
      toTasks.splice(destination.index, 0, movedTask)
      newData.columns[fromColumn] = fromTasks
      newData.columns[toColumn] = toTasks
    }

    setData(newData)

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
          await fetchBoard()
        }
      } catch {
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
    <div>
      {/* Controls */}
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Group by:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm"
          >
            <option value="none">None</option>
            <option value="project">Project</option>
            <option value="priority">Priority</option>
            <option value="listType">List Type</option>
          </select>
        </label>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Swimlanes when grouped */}
        {groupBy !== 'none' ? (
          <div className="space-y-6">
            {groups.map((group) => {
              // Check if this group has any tasks
              const hasAnyTasks = BOARD_COLUMNS.some(
                (col) => getTasksForGroup(col, group.key).length > 0
              )

              if (!hasAnyTasks) return null

              return (
                <div key={group.key} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Swimlane header */}
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      {group.emoji && <span>{group.emoji}</span>}
                      {group.label}
                      <span className="text-xs text-gray-400 font-normal">
                        ({BOARD_COLUMNS.reduce(
                          (sum, col) => sum + getTasksForGroup(col, group.key).length,
                          0
                        )} tasks)
                      </span>
                    </h3>
                  </div>

                  {/* Columns for this swimlane */}
                  <div className="flex gap-2 p-2 overflow-x-auto">
                    {BOARD_COLUMNS.map((column) => {
                      const meta = COLUMN_META[column]
                      const tasks = getTasksForGroup(column, group.key)
                      const droppableId = `${column}:${group.key}`

                      return (
                        <div
                          key={column}
                          className={`flex-shrink-0 w-56 ${meta.color} rounded-lg flex flex-col`}
                        >
                          {/* Column header */}
                          <div className="px-2 py-1.5 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span>{meta.emoji}</span>
                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                {meta.label}
                              </span>
                              <span className="px-1 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-gray-500 dark:text-gray-400">
                                {tasks.length}
                              </span>
                            </div>
                          </div>

                          {/* Droppable area */}
                          <Droppable droppableId={droppableId}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex-1 p-1.5 space-y-1.5 overflow-y-auto max-h-64 transition-colors ${
                                  snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                }`}
                              >
                                {tasks.map((task, index) => (
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
                                        className={`cursor-grab active:cursor-grabbing transition-shadow ${
                                          snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
                                        }`}
                                      >
                                        <TaskCard task={task} isMoving={moving === task.id} />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Flat board (no grouping) */
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
                        {tasks.map((task, index) => (
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
                                className={`cursor-grab active:cursor-grabbing transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
                                }`}
                              >
                                <TaskCard task={task} isMoving={moving === task.id} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        )}
      </DragDropContext>
    </div>
  )
}
