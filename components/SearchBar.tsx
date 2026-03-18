'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { RTMTaskSeries } from '../lib/rtm'

interface SearchResult {
  task: RTMTaskSeries
  listName: string | null
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

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(due: string): boolean {
  if (!due) return false
  const dueDate = new Date(due)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dueDate < today
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results ?? [])
        setIsOpen(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          // Could navigate to task or show details
          console.log('Selected:', results[selectedIndex].task.name)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }, [isOpen, results, selectedIndex])

  // Global keyboard shortcut to focus search
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search tasks... (press /)"
          data-search-input
          className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
          {results.map((result, index) => {
            const task = getFirstTask(result.task)
            const priority = task?.priority ?? 'N'
            const due = task?.due ?? ''
            const overdue = isOverdue(due)

            return (
              <button
                key={result.task.id}
                onClick={() => {
                  console.log('Clicked:', result.task.name)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <span className="w-4 text-center shrink-0">{getPriorityEmoji(priority)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 dark:text-white truncate">
                    {result.task.name}
                  </div>
                  {result.listName && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {result.listName}
                    </div>
                  )}
                </div>
                {due && (
                  <span
                    className={`text-xs shrink-0 ${
                      overdue
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
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
          No tasks found
        </div>
      )}
    </div>
  )
}
