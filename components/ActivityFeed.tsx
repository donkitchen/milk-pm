'use client'

import { useEffect, useState } from 'react'
import TaskDetailModal from './TaskDetailModal'

interface Activity {
  id: string
  name: string
  listId: string
  listName: string | null
  modified: string
  completed: string | null
  added: string
  priority: string
  activityType: 'completed' | 'modified' | 'added'
}

const ACTIVITY_META: Record<Activity['activityType'], { icon: string; label: string; color: string }> = {
  completed: { icon: '✓', label: 'Completed', color: 'text-green-600 dark:text-green-400' },
  modified: { icon: '✎', label: 'Updated', color: 'text-blue-600 dark:text-blue-400' },
  added: { icon: '+', label: 'Added', color: 'text-purple-600 dark:text-purple-400' },
}

const PRIORITY_COLORS: Record<string, string> = {
  '1': 'border-l-red-500',
  '2': 'border-l-yellow-500',
  '3': 'border-l-blue-500',
  'N': 'border-l-transparent',
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function extractProjectName(listName: string | null): string | null {
  if (!listName) return null
  // Match "CC: project-name - List" pattern
  const match = listName.match(/^CC:\s*([^-]+)\s*-/)
  return match ? match[1].trim() : listName
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch('/api/activity')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setActivities(data.activities ?? [])
      } catch (err) {
        setError('Failed to load activity')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
    // Refresh every 2 minutes
    const interval = setInterval(fetchActivity, 120000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">⚡</span>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Recent Activity
          </h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 py-2">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">⚡</span>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Recent Activity
          </h2>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          No recent activity
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between gap-2 p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Recent Activity
          </h2>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {activities.length}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!isCollapsed && (
        <div className="px-4 pb-4">
          <div className="space-y-1">
            {activities.map((activity) => {
              const meta = ACTIVITY_META[activity.activityType]
              const projectName = extractProjectName(activity.listName)
              const timestamp = activity.completed ?? activity.modified

              return (
                <button
                  key={activity.id}
                  onClick={() => setSelectedTaskId(activity.id)}
                  className={`w-full flex items-start gap-2 py-2 px-2 rounded border-l-2 ${PRIORITY_COLORS[activity.priority] ?? PRIORITY_COLORS['N']} bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left`}
                >
                  <span className={`text-xs font-medium ${meta.color} w-4 text-center shrink-0 mt-0.5`}>
                    {meta.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${activity.activityType === 'completed' ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                      {activity.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {projectName && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {projectName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                    {formatRelativeTime(timestamp)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  )
}
