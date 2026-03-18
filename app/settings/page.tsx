'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { ProjectConfig } from '../../lib/projects'

interface DiscoveredProject {
  slug: string
  name: string
  lists: {
    todo: string
    backlog: string
    bugs: string
    decisions: string
    context: string
  }
  enabled: boolean
  config: ProjectConfig | null
}

const COLORS = ['blue', 'teal', 'purple', 'amber', 'green', 'red', 'gray']

const COLOR_PREVIEW: Record<string, string> = {
  blue: 'bg-blue-500',
  teal: 'bg-teal-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  gray: 'bg-gray-500',
}

export default function SettingsPage() {
  const [projects, setProjects] = useState<DiscoveredProject[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    // Get user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
    fetchProjects()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setProjects(data.projects)
    } catch (err) {
      setError('Failed to load projects from RTM')
    } finally {
      setLoading(false)
    }
  }

  async function saveProjects() {
    setSaving(true)
    setError(null)

    // Build the projects.json content from enabled projects
    const enabledProjects: ProjectConfig[] = projects
      .filter((p) => p.enabled)
      .map((p) => ({
        slug: p.slug,
        name: p.config?.name ?? p.name,
        description: p.config?.description ?? '',
        color: p.config?.color ?? 'blue',
        url: p.config?.url ?? '',
        convention: 'milk-mcp',
        lists: p.lists,
      }))

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: enabledProjects }),
      })
      if (!res.ok) throw new Error('Failed to save')
      // Refresh to get updated state
      await fetchProjects()
    } catch (err) {
      setError('Failed to save projects')
    } finally {
      setSaving(false)
    }
  }

  function toggleProject(slug: string) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.slug !== slug) return p
        const nowEnabled = !p.enabled
        return {
          ...p,
          enabled: nowEnabled,
          config: nowEnabled
            ? p.config ?? {
                slug: p.slug,
                name: p.name,
                description: '',
                color: 'blue',
                url: '',
                convention: 'milk-mcp',
                lists: p.lists,
              }
            : null,
        }
      })
    )
  }

  function updateConfig(slug: string, updates: Partial<ProjectConfig>) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.slug !== slug || !p.config) return p
        return { ...p, config: { ...p.config, ...updates } }
      })
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10 sm:px-8 max-w-4xl mx-auto">
        <p className="text-gray-500">Loading projects from RTM...</p>
      </main>
    )
  }

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage which projects appear on your dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveProjects}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.user_metadata?.full_name || user.email}
              </p>
              <p className="text-xs text-gray-500">
                {user.user_metadata?.user_name && `@${user.user_metadata.user_name}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Sign out
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Project list */}
      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No milk-mcp projects found in RTM.</p>
            <p className="text-sm mt-2">
              Projects should have lists named like "CC: project-name - TODO"
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.slug}
              className={`border rounded-lg p-4 transition-colors ${
                project.enabled
                  ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Toggle */}
                <button
                  onClick={() => toggleProject(project.slug)}
                  className={`mt-1 w-10 h-6 rounded-full transition-colors relative ${
                    project.enabled
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      project.enabled ? 'left-5' : 'left-1'
                    }`}
                  />
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {project.config?.name ?? project.name}
                    </h3>
                    <code className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      {project.slug}
                    </code>
                  </div>

                  {project.enabled && project.config && (
                    <div className="mt-3 space-y-3">
                      {editingSlug === project.slug ? (
                        <>
                          {/* Edit form */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Display Name
                              </label>
                              <input
                                type="text"
                                value={project.config.name}
                                onChange={(e) =>
                                  updateConfig(project.slug, {
                                    name: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Color
                              </label>
                              <div className="flex gap-1.5">
                                {COLORS.map((color) => (
                                  <button
                                    key={color}
                                    onClick={() =>
                                      updateConfig(project.slug, { color })
                                    }
                                    className={`w-6 h-6 rounded-full ${COLOR_PREVIEW[color]} ${
                                      project.config?.color === color
                                        ? 'ring-2 ring-offset-2 ring-gray-400'
                                        : ''
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={project.config.description ?? ''}
                              onChange={(e) =>
                                updateConfig(project.slug, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Optional description"
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Repository URL
                            </label>
                            <input
                              type="text"
                              value={project.config.url ?? ''}
                              onChange={(e) =>
                                updateConfig(project.slug, {
                                  url: e.target.value,
                                })
                              }
                              placeholder="https://github.com/..."
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>
                          <button
                            onClick={() => setEditingSlug(null)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Done editing
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Display info */}
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span
                              className={`w-3 h-3 rounded-full ${
                                COLOR_PREVIEW[project.config.color]
                              }`}
                            />
                            {project.config.description && (
                              <span>{project.config.description}</span>
                            )}
                            {project.config.url && (
                              <a
                                href={project.config.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                ↗ repo
                              </a>
                            )}
                          </div>
                          <button
                            onClick={() => setEditingSlug(project.slug)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Edit details
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {!project.enabled && (
                    <p className="text-xs text-gray-400 mt-1">
                      RTM lists: {project.lists.todo}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
