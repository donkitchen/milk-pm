'use client'

import { useEffect, useState, useCallback } from 'react'
import type { RTMTaskSeries } from '../lib/rtm'
import TaskDetailModal from './TaskDetailModal'

interface TaskWithMeta extends RTMTaskSeries {
  listName?: string
}

interface TodayData {
  overdue: TaskWithMeta[]
  dueToday: TaskWithMeta[]
  completedToday: number
  totalToday: number
}

function getFirstTask(series: RTMTaskSeries) {
  if (!series.task) return null
  return Array.isArray(series.task) ? series.task[0] : series.task
}

function getPriorityStyles(priority: string): { dot: string; text: string } {
  switch (priority) {
    case '1':
      return { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' }
    case '2':
      return { dot: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' }
    case '3':
      return { dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' }
    default:
      return { dot: 'bg-gray-300 dark:bg-gray-600', text: 'text-gray-500' }
  }
}

function formatDueDate(due: string): string {
  if (!due) return ''
  const date = new Date(due)
  const today = new Date()
  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const days = Math.abs(diffDays)
    return days === 1 ? 'Yesterday' : `${days} days ago`
  }

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function MyDayView() {
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overdueExpanded, setOverdueExpanded] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/today')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch today tasks:', err)
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (completingTasks.has(taskId)) return

    setCompletingTasks((prev) => new Set(prev).add(taskId))

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })

      if (!res.ok) throw new Error('Failed to complete task')

      // Refresh data
      await fetchData()
    } catch (err) {
      console.error('Failed to complete task:', err)
    } finally {
      setCompletingTasks((prev) => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  const renderTaskCard = (task: TaskWithMeta, isOverdue = false) => {
    const firstTask = getFirstTask(task)
    const priority = firstTask?.priority ?? 'N'
    const due = firstTask?.due ?? ''
    const styles = getPriorityStyles(priority)
    const isCompleting = completingTasks.has(task.id)

    return (
      <div
        key={task.id}
        onClick={() => setSelectedTaskId(task.id)}
        className={`group relative p-4 rounded-xl border cursor-pointer transition-all ${
          isOverdue
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 hover:border-red-300 dark:hover:border-red-800'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
        } hover:shadow-sm`}
      >
        <div className="flex items-start gap-3">
          {/* Completion checkbox */}
          <button
            onClick={(e) => handleComplete(task.id, e)}
            disabled={isCompleting}
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors ${
              isCompleting
                ? 'border-green-500 bg-green-500'
                : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400'
            } flex items-center justify-center`}
          >
            {isCompleting && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* Priority dot */}
              <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {task.name}
              </h3>
            </div>

            <div className="mt-1 flex items-center gap-3 text-sm">
              {/* Project badge */}
              {task.listName && (
                <span className="text-gray-500 dark:text-gray-400">
                  {task.listName}
                </span>
              )}
              {/* Due date for overdue items */}
              {isOverdue && due && (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {formatDueDate(due)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-8" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
        {error}
      </div>
    )
  }

  if (!data) return null

  const hasOverdue = data.overdue.length > 0
  const hasDueToday = data.dueToday.length > 0
  const totalActive = data.overdue.length + data.dueToday.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Day
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {data.completedToday} of {data.totalToday} tasks completed
        </p>
        {/* Progress bar */}
        {data.totalToday > 0 && (
          <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${(data.completedToday / data.totalToday) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Empty state */}
      {totalActive === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">
            {data.completedToday > 0 ? '🎉' : '☀️'}
          </div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {data.completedToday > 0 ? 'All done!' : 'No tasks for today'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {data.completedToday > 0
              ? `You completed ${data.completedToday} task${data.completedToday === 1 ? '' : 's'} today.`
              : 'Enjoy your day!'}
          </p>
        </div>
      )}

      {/* Overdue section */}
      {hasOverdue && (
        <div>
          <button
            onClick={() => setOverdueExpanded(!overdueExpanded)}
            className="flex items-center gap-2 mb-3 w-full text-left"
          >
            <svg
              className={`w-4 h-4 text-red-500 transition-transform ${
                overdueExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Overdue
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
              {data.overdue.length}
            </span>
          </button>

          {overdueExpanded && (
            <div className="space-y-2">
              {data.overdue.map((task) => renderTaskCard(task, true))}
            </div>
          )}
        </div>
      )}

      {/* Due Today section */}
      {hasDueToday && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
            Due Today
          </h2>
          <div className="space-y-2">
            {data.dueToday.map((task) => renderTaskCard(task, false))}
          </div>
        </div>
      )}

      {/* Task detail modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={fetchData}
      />
    </div>
  )
}
