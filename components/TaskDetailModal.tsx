'use client'

import { useEffect, useState } from 'react'

interface TaskDetail {
  id: string
  name: string
  listName: string | null
  priority: string
  due: string | null
  completed: string | null
  added: string
  tags: string[]
  notes: { id: string; title: string; body: string }[]
  estimate: string | null
  url: string | null
}

interface Props {
  taskId: string | null
  onClose: () => void
}

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  '1': { label: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  '2': { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  '3': { label: 'Low', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  'N': { label: 'None', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function TaskDetailModal({ taskId, onClose }: Props) {
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!taskId) {
      setTask(null)
      setCopied(false)
      return
    }
    setCopied(false)

    async function fetchTask() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/tasks/${taskId}`)
        if (!res.ok) throw new Error('Failed to fetch task')
        const data = await res.json()
        setTask(data.task)
      } catch (err) {
        setError('Failed to load task details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [taskId])

  // Close on escape
  useEffect(() => {
    if (!taskId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [taskId, onClose])

  if (!taskId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        data-modal
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 max-w-lg w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Task Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">{error}</div>
          )}

          {task && !loading && (
            <div className="space-y-4">
              {/* Task name */}
              <div>
                <h3 className={`text-lg font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                  {task.name}
                </h3>
                {task.listName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    in {task.listName}
                  </p>
                )}
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                {task.completed && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                    Completed
                  </span>
                )}
                <span className={`px-2 py-1 text-xs font-medium rounded ${PRIORITY_META[task.priority]?.color ?? PRIORITY_META['N'].color}`}>
                  Priority: {PRIORITY_META[task.priority]?.label ?? 'None'}
                </span>
              </div>

              {/* Due date */}
              {task.due && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(task.due)}
                  </dd>
                </div>
              )}

              {/* Completed date */}
              {task.completed && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completed</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDateTime(task.completed)}
                  </dd>
                </div>
              )}

              {/* Added date */}
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Added</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDateTime(task.added)}
                </dd>
              </div>

              {/* Tags */}
              {task.tags.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tags</dt>
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Estimate */}
              {task.estimate && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estimate</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {task.estimate}
                  </dd>
                </div>
              )}

              {/* Notes */}
              {task.notes.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notes</dt>
                  <div className="space-y-2">
                    {task.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                      >
                        {note.title && (
                          <p className="font-medium text-gray-900 dark:text-white mb-1">{note.title}</p>
                        )}
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{note.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* URL */}
              {task.url && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Link</dt>
                  <dd className="mt-1">
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {task.url}
                    </a>
                  </dd>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            {task && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(task.id)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
                className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-mono transition-colors"
                title="Click to copy ID"
              >
                {copied ? 'Copied!' : `ID: ${task.id}`}
              </button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
