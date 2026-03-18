'use client'

import { useState, useRef, useEffect } from 'react'

interface QuickAddProps {
  listId?: string
  listName?: string
  onTaskAdded?: () => void
  placeholder?: string
}

export default function QuickAdd({
  listId,
  listName,
  onTaskAdded,
  placeholder = 'Add a task... (try "Fix login bug tomorrow !1 #frontend")',
}: QuickAddProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Clear success message after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Global keyboard shortcut to focus quick add
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'q' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const taskName = value.trim()
    if (!taskName) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: taskName, listId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add task')
      }

      setValue('')
      setSuccess(true)
      onTaskAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            data-quickadd-input
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Add'
          )}
        </button>
      </div>

      {listName && (
        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Adding to: {listName}
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-2 text-sm text-green-600 dark:text-green-400">
          Task added!
        </div>
      )}

      <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        <span className="font-medium">Smart parsing:</span>{' '}
        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">!1</code>{' '}
        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">!2</code>{' '}
        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">!3</code> for priority,{' '}
        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">#tag</code> for tags,{' '}
        dates like{' '}
        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">tomorrow</code>{' '}
        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">next friday</code>
      </div>
    </form>
  )
}
