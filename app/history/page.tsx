import Link from 'next/link'
import { searchTasks, getFirstTask, getTags, getLists } from '../../lib/rtm'
import { RTM_FILTERS } from '../../lib/filters'

export const dynamic = 'force-dynamic'

function formatCompletedDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === now.toDateString()) {
    return 'Today'
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function groupByDate<T extends { completed: string }>(
  tasks: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>()

  for (const task of tasks) {
    const dateKey = formatCompletedDate(task.completed)
    const existing = groups.get(dateKey) ?? []
    existing.push(task)
    groups.set(dateKey, existing)
  }

  return groups
}

export default async function HistoryPage() {
  const [completedTasks, lists] = await Promise.all([
    searchTasks(RTM_FILTERS.completedThisWeek, { cache: false }),
    getLists(),
  ])

  // Build list name lookup
  const listMap = new Map(lists.map((l) => [l.id, l.name]))

  // Extract completion info and sort by completion date (newest first)
  const tasksWithCompletion = completedTasks
    .map((series) => {
      const task = getFirstTask(series)
      return {
        ...series,
        completed: task?.completed ?? '',
        listName: series.list_id ? listMap.get(series.list_id) : null,
      }
    })
    .filter((t) => t.completed)
    .sort((a, b) => new Date(b.completed).getTime() - new Date(a.completed).getTime())

  const groupedTasks = groupByDate(tasksWithCompletion)

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10 sm:px-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6"
      >
        ← Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          History
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Tasks completed in the last 7 days
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-semibold text-green-700 dark:text-green-300">
            {tasksWithCompletion.length}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            Completed this week
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            {groupedTasks.size}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Days with activity
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            {tasksWithCompletion.length > 0
              ? Math.round(tasksWithCompletion.length / 7)
              : 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Avg per day
          </div>
        </div>
      </div>

      {/* Task list grouped by date */}
      {tasksWithCompletion.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <p className="text-lg">No tasks completed this week</p>
          <p className="text-sm mt-2">
            Complete some tasks and they&apos;ll appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedTasks.entries()).map(([dateLabel, tasks]) => (
            <div key={dateLabel}>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <span>{dateLabel}</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  {tasks.length}
                </span>
              </h2>
              <div className="space-y-1">
                {tasks.map((task) => {
                  const tags = getTags(task)

                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 py-2 px-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <span className="text-green-500">✓</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-700 dark:text-gray-300 line-through opacity-75">
                          {task.name}
                        </span>
                        {task.listName && (
                          <span className="ml-2 text-xs text-gray-400">
                            in {task.listName}
                          </span>
                        )}
                      </div>
                      {tags.length > 0 && (
                        <div className="flex gap-1">
                          {tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                        {formatTime(task.completed)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
