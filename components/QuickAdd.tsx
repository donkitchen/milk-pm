'use client'

import { useState, useRef, useEffect } from 'react'

interface ProjectOption {
  slug: string
  name: string
  lists: Record<string, string>
}

const LIST_TYPES = [
  { key: 'todo', label: 'TODO' },
  { key: 'backlog', label: 'Backlog' },
  { key: 'bugs', label: 'Bugs' },
] as const

interface QuickAddProps {
  defaultProject?: string
  defaultListType?: string
  onTaskAdded?: () => void
}

export default function QuickAdd({
  defaultProject,
  defaultListType = 'todo',
  onTaskAdded,
}: QuickAddProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [selectedProject, setSelectedProject] = useState(defaultProject ?? '')
  const [selectedListType, setSelectedListType] = useState(defaultListType)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch projects on mount
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const data = await res.json()
          const projectList = (data.projects ?? []).map((p: { slug: string; name: string; lists: Record<string, string> }) => ({
            slug: p.slug,
            name: p.name,
            lists: p.lists ?? {},
          }))
          setProjects(projectList)
          // Auto-select first project if none selected
          if (!selectedProject && projectList.length > 0) {
            setSelectedProject(projectList[0].slug)
          }
        }
      } catch (e) {
        console.error('Failed to fetch projects:', e)
      } finally {
        setLoadingProjects(false)
      }
    }
    fetchProjects()
  }, [])

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
      if (e.key === 'q' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Get the list ID for the selected project and list type
  const getSelectedListId = (): string | null => {
    const project = projects.find((p) => p.slug === selectedProject)
    if (!project?.lists) return null
    return project.lists[selectedListType] ?? null
  }

  const getSelectedListName = (): string | null => {
    const project = projects.find((p) => p.slug === selectedProject)
    if (!project?.lists) return null
    return project.lists[selectedListType] ?? null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const taskName = value.trim()
    if (!taskName) return

    const listId = getSelectedListId()
    if (!listId) {
      setError('Please select a project and list')
      return
    }

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

  const selectedProjectName = projects.find((p) => p.slug === selectedProject)?.name

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Project and List Type selectors */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1">
          <label className="sr-only">Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={loadingProjects || loading}
            className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white disabled:opacity-50"
          >
            {loadingProjects ? (
              <option>Loading projects...</option>
            ) : projects.length === 0 ? (
              <option>No projects configured</option>
            ) : (
              projects.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label className="sr-only">List</label>
          <select
            value={selectedListType}
            onChange={(e) => setSelectedListType(e.target.value)}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white disabled:opacity-50"
          >
            {LIST_TYPES.map((lt) => (
              <option key={lt.key} value={lt.key}>
                {lt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task input */}
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
            placeholder='Add a task... (try "Fix login bug tomorrow !1")'
            disabled={loading || projects.length === 0}
            data-quickadd-input
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim() || projects.length === 0}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Add'
          )}
        </button>
      </div>

      {/* Status messages */}
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-2 text-sm text-green-600 dark:text-green-400">
          Task added to {selectedProjectName} / {LIST_TYPES.find((lt) => lt.key === selectedListType)?.label}!
        </div>
      )}

      {/* Help text */}
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
