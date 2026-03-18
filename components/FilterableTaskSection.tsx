'use client'

import { useState, useMemo } from 'react'
import { RTMTaskSeries } from '../lib/rtm'
import { ListRole } from '../lib/projects'
import { LIST_ROLE_META } from '../types/projects'
import PriorityFilter, { PriorityValue } from './PriorityFilter'
import TaskDetailModal from './TaskDetailModal'

interface Props {
  role: ListRole
  tasks: RTMTaskSeries[]
  hasRtmList: boolean
}

type SortOption = 'priority' | 'due' | 'name'

function getPriority(series: RTMTaskSeries): string {
  const task = Array.isArray(series.task) ? series.task[0] : series.task
  return task?.priority ?? 'N'
}

function getDueDate(series: RTMTaskSeries): string | null {
  const task = Array.isArray(series.task) ? series.task[0] : series.task
  return task?.due ?? null
}

function getTags(series: RTMTaskSeries): string[] {
  if (!series.tags) return []
  if (typeof series.tags === 'string') return []
  if (Array.isArray(series.tags.tag)) return series.tags.tag
  if (typeof series.tags.tag === 'string') return [series.tags.tag]
  return []
}

function formatDue(due: string): { label: string; overdue: boolean } {
  const d = new Date(due)
  const now = new Date()
  const overdue = d < now
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { label, overdue }
}

const PRIORITY_LABEL: Record<string, string> = {
  '1': '🔴',
  '2': '🟡',
  '3': '🔵',
  N: '',
}

const PRIORITY_ORDER: Record<string, number> = {
  '1': 1,
  '2': 2,
  '3': 3,
  'N': 4,
}

export default function FilterableTaskSection({ role, tasks, hasRtmList }: Props) {
  const [priorityFilter, setPriorityFilter] = useState<PriorityValue>('all')
  const [sortBy, setSortBy] = useState<SortOption>('priority')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const meta = LIST_ROLE_META[role]

  // Count tasks by priority
  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = { '1': 0, '2': 0, '3': 0, 'N': 0 }
    for (const task of tasks) {
      const p = getPriority(task)
      counts[p] = (counts[p] || 0) + 1
    }
    return counts
  }, [tasks])

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = tasks

    // Filter by priority
    if (priorityFilter !== 'all') {
      result = result.filter((t) => getPriority(t) === priorityFilter)
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'priority') {
        const pA = PRIORITY_ORDER[getPriority(a)] ?? 4
        const pB = PRIORITY_ORDER[getPriority(b)] ?? 4
        if (pA !== pB) return pA - pB
        // Secondary sort by due date
        const dueA = getDueDate(a)
        const dueB = getDueDate(b)
        if (dueA && dueB) return new Date(dueA).getTime() - new Date(dueB).getTime()
        if (dueA) return -1
        if (dueB) return 1
        return 0
      }

      if (sortBy === 'due') {
        const dueA = getDueDate(a)
        const dueB = getDueDate(b)
        if (dueA && dueB) return new Date(dueA).getTime() - new Date(dueB).getTime()
        if (dueA) return -1
        if (dueB) return 1
        return 0
      }

      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }

      return 0
    })

    return result
  }, [tasks, priorityFilter, sortBy])

  return (
    <section>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{meta.emoji}</span>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            {meta.label}
          </h2>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {filteredTasks.length}
            {priorityFilter !== 'all' && (
              <span className="text-gray-400 dark:text-gray-500">/{tasks.length}</span>
            )}
          </span>
          {!hasRtmList && (
            <span className="text-xs text-amber-500 dark:text-amber-400 ml-1">
              list not found in RTM
            </span>
          )}
        </div>

        {/* Filter and sort controls */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-3">
            <PriorityFilter
              value={priorityFilter}
              onChange={setPriorityFilter}
              counts={priorityCounts}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded px-2 py-1 text-gray-600 dark:text-gray-400"
            >
              <option value="priority">Sort: Priority</option>
              <option value="due">Sort: Due Date</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        )}
      </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded-lg px-4">
        {filteredTasks.length === 0 ? (
          <div className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
            {tasks.length === 0
              ? `No items in ${meta.label}`
              : `No ${priorityFilter === 'N' ? 'unprioritized' : `P${priorityFilter}`} items`
            }
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredTasks.map((series) => {
              const due = getDueDate(series)
              const priority = getPriority(series)
              const tags = getTags(series)
              const priorityIcon = PRIORITY_LABEL[priority] ?? ''
              const dueInfo = due ? formatDue(due) : null

              return (
                <li
                  key={series.id}
                  onClick={() => setSelectedTaskId(series.id)}
                  className="flex items-start gap-3 py-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 transition-colors"
                >
                  {/* Priority dot */}
                  <span className="mt-0.5 text-xs w-4 shrink-0">{priorityIcon}</span>

                  {/* Name + tags */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 dark:text-gray-200 truncate hover:text-blue-600 dark:hover:text-blue-400">
                      {series.name}
                    </p>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Due date */}
                  {dueInfo && (
                    <span
                      className={`text-xs shrink-0 mt-0.5 font-medium ${
                        dueInfo.overdue
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {dueInfo.label}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </section>
  )
}
