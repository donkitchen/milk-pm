'use client'

import { useEffect, useState } from 'react'
import type { RTMTaskSeries } from '../lib/rtm'
import TaskDetailModal from './TaskDetailModal'

interface DueGroup {
  label: string
  filter: string
  tasks: RTMTaskSeries[]
  count: number
}

function getFirstTask(series: RTMTaskSeries) {
  if (!series.task) return null
  return Array.isArray(series.task) ? series.task[0] : series.task
}

function getPriorityEmoji(priority: string): string {
  switch (priority) {
    case '1': return '🔴'
    case '2': return '🟡'
    case '3': return '🔵'
    default: return ''
  }
}

function formatDueDate(due: string): string {
  if (!due) return ''
  const date = new Date(due)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function DueSection() {
  const [groups, setGroups] = useState<DueGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Overdue']))
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDueTasks() {
      try {
        const res = await fetch('/api/due')
        const data = await res.json()
        setGroups(data.groups ?? [])
      } catch (error) {
        console.error('Failed to fetch due tasks:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDueTasks()
  }, [])

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  const totalDue = groups.reduce((sum, g) => sum + g.count, 0)

  if (loading) {
    return (
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (totalDue === 0) {
    return null
  }

  return (
    <div className="mb-6 space-y-2">
      {groups.map((group) => {
        if (group.count === 0) return null

        const isExpanded = expandedGroups.has(group.label)
        const isOverdue = group.label === 'Overdue'

        return (
          <div
            key={group.label}
            className={`rounded-lg border ${
              isOverdue
                ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30'
                : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900'
            }`}
          >
            <button
              onClick={() => toggleGroup(group.label)}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    isOverdue
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {group.label}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isOverdue
                      ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {group.count}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && group.tasks.length > 0 && (
              <div className="px-4 pb-3 space-y-1">
                {group.tasks.slice(0, 10).map((series) => {
                  const task = getFirstTask(series)
                  const priority = task?.priority ?? 'N'
                  const due = task?.due ?? ''

                  return (
                    <button
                      key={series.id}
                      onClick={() => setSelectedTaskId(series.id)}
                      className="w-full flex items-center gap-2 text-sm py-1.5 px-2 -mx-2 rounded hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors text-left"
                    >
                      <span className="w-4 text-center">{getPriorityEmoji(priority)}</span>
                      <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">
                        {series.name}
                      </span>
                      {due && (
                        <span
                          className={`text-xs ${
                            isOverdue
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {formatDueDate(due)}
                        </span>
                      )}
                    </button>
                  )
                })}
                {group.tasks.length > 10 && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 pt-1">
                    +{group.tasks.length - 10} more
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  )
}
