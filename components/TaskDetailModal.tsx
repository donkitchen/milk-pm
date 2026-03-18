'use client'

import { useEffect, useState, useCallback } from 'react'

interface TaskDetail {
  id: string
  taskId: string | null
  listId: string | null
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
  onUpdate?: () => void
}

const PRIORITY_OPTIONS = [
  { value: '1', label: 'High', color: 'bg-red-500' },
  { value: '2', label: 'Medium', color: 'bg-yellow-500' },
  { value: '3', label: 'Low', color: 'bg-blue-500' },
  { value: 'N', label: 'None', color: 'bg-gray-400' },
]

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

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toISOString().split('T')[0]
}

export default function TaskDetailModal({ taskId, onClose, onUpdate }: Props) {
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    priority: 'N',
    due: '',
    estimate: '',
    url: '',
    tags: '',
  })

  // New note state
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', body: '' })

  const fetchTask = useCallback(async () => {
    if (!taskId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tasks/${taskId}`)
      if (!res.ok) throw new Error('Failed to fetch task')
      const data = await res.json()
      setTask(data.task)
      // Initialize edit form
      setEditForm({
        name: data.task.name,
        priority: data.task.priority,
        due: toDateInputValue(data.task.due),
        estimate: data.task.estimate ?? '',
        url: data.task.url ?? '',
        tags: data.task.tags.join(', '),
      })
    } catch (err) {
      setError('Failed to load task details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    if (!taskId) {
      setTask(null)
      setCopied(false)
      setIsEditing(false)
      return
    }
    setCopied(false)
    setIsEditing(false)
    fetchTask()
  }, [taskId, fetchTask])

  // Close on escape (only when not editing)
  useEffect(() => {
    if (!taskId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (isEditing) {
          setIsEditing(false)
        } else {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [taskId, onClose, isEditing])

  const handleSave = async () => {
    if (!task) return
    setSaving(true)
    setError(null)

    try {
      const tagsArray = editForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          priority: editForm.priority,
          due: editForm.due || null,
          estimate: editForm.estimate || null,
          url: editForm.url || null,
          tags: tagsArray,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update task')
      }

      setIsEditing(false)
      await fetchTask()
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleComplete = async () => {
    if (!task) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })

      if (!res.ok) throw new Error('Failed to update task')

      await fetchTask()
      onUpdate?.()
    } catch (err) {
      setError('Failed to update completion status')
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!task || !newNote.body.trim()) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addNote: { title: newNote.title, body: newNote.body },
        }),
      })

      if (!res.ok) throw new Error('Failed to add note')

      setNewNote({ title: '', body: '' })
      setShowAddNote(false)
      await fetchTask()
      onUpdate?.()
    } catch (err) {
      setError('Failed to add note')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!task || !confirm('Delete this note?')) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteNoteId: noteId }),
      })

      if (!res.ok) throw new Error('Failed to delete note')

      await fetchTask()
      onUpdate?.()
    } catch (err) {
      setError('Failed to delete note')
    } finally {
      setSaving(false)
    }
  }

  if (!taskId) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        data-modal
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 max-w-lg w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Task' : 'Task Details'}
          </h2>
          <div className="flex items-center gap-2">
            {task && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          {task && !loading && isEditing && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Priority
                </label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setEditForm({ ...editForm, priority: opt.value })}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                        editForm.priority === opt.value
                          ? `${opt.color} text-white`
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editForm.due}
                  onChange={(e) => setEditForm({ ...editForm, due: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Estimate */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Estimate
                </label>
                <input
                  type="text"
                  value={editForm.estimate}
                  onChange={(e) => setEditForm({ ...editForm, estimate: e.target.value })}
                  placeholder="e.g., 1 hour, 30 min"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-400">Comma-separated</p>
              </div>

              {/* Save/Cancel buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {task && !loading && !isEditing && (
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

              {/* Status badges + complete toggle */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleToggleComplete}
                  disabled={saving}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    task.completed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {task.completed ? '✓ Completed' : '○ Mark Complete'}
                </button>
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</dt>
                  <button
                    onClick={() => setShowAddNote(!showAddNote)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showAddNote ? 'Cancel' : '+ Add Note'}
                  </button>
                </div>

                {showAddNote && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                    <input
                      type="text"
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      placeholder="Title (optional)"
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                    <textarea
                      value={newNote.body}
                      onChange={(e) => setNewNote({ ...newNote, body: e.target.value })}
                      placeholder="Note content..."
                      rows={3}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={saving || !newNote.body.trim()}
                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded transition-colors"
                    >
                      {saving ? 'Adding...' : 'Add Note'}
                    </button>
                  </div>
                )}

                {task.notes.length > 0 ? (
                  <div className="space-y-2">
                    {task.notes.map((note) => (
                      <div
                        key={note.id}
                        className="group p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm relative"
                      >
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                          title="Delete note"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {note.title && (
                          <p className="font-medium text-gray-900 dark:text-white mb-1">{note.title}</p>
                        )}
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{note.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  !showAddNote && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">No notes</p>
                  )
                )}
              </div>

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
              Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Esc</kbd> to {isEditing ? 'cancel' : 'close'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
