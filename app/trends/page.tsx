'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TrendsChart from '../../components/TrendsChart'

interface Snapshot {
  id: string
  project_slug: string
  snapshot_date: string
  todo_count: number
  backlog_count: number
  bugs_count: number
  completed_today: number
}

interface ProjectConfig {
  slug: string
  name: string
  color: string
}

export default function TrendsPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [projects, setProjects] = useState<ProjectConfig[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [chartType, setChartType] = useState<'line' | 'area'>('area')

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const data = await res.json()
          setProjects(data.projects ?? [])
        }
      } catch (e) {
        console.error('Failed to fetch projects:', e)
      }
    }
    fetchProjects()
  }, [])

  // Fetch snapshots
  useEffect(() => {
    async function fetchSnapshots() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ days: days.toString() })
        if (selectedProject) {
          params.set('project', selectedProject)
        }
        const res = await fetch(`/api/snapshots?${params}`)
        if (res.ok) {
          const data = await res.json()
          setSnapshots(data.snapshots ?? [])
        }
      } catch (e) {
        console.error('Failed to fetch snapshots:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchSnapshots()
  }, [days, selectedProject])

  const createSnapshot = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/snapshots', { method: 'POST' })
      if (res.ok) {
        // Refresh snapshots
        const params = new URLSearchParams({ days: days.toString() })
        if (selectedProject) {
          params.set('project', selectedProject)
        }
        const refreshRes = await fetch(`/api/snapshots?${params}`)
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          setSnapshots(data.snapshots ?? [])
        }
      }
    } catch (e) {
      console.error('Failed to create snapshot:', e)
    } finally {
      setCreating(false)
    }
  }

  // Calculate summary stats
  const latestDate = snapshots.length > 0
    ? snapshots.reduce((max, s) => s.snapshot_date > max ? s.snapshot_date : max, snapshots[0].snapshot_date)
    : null

  const latestSnapshots = latestDate
    ? snapshots.filter((s) => s.snapshot_date === latestDate)
    : []

  const totalTodo = latestSnapshots.reduce((sum, s) => sum + s.todo_count, 0)
  const totalBacklog = latestSnapshots.reduce((sum, s) => sum + s.backlog_count, 0)
  const totalBugs = latestSnapshots.reduce((sum, s) => sum + s.bugs_count, 0)

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10 sm:px-8 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6"
      >
        ← Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Trends
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track task counts over time
          </p>
        </div>
        <button
          onClick={createSnapshot}
          disabled={creating}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {creating ? 'Creating...' : 'Create Snapshot'}
        </button>
      </div>

      {/* Stats */}
      {latestSnapshots.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-8">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
            <div className="text-2xl font-semibold text-blue-700 dark:text-blue-300">
              {totalTodo}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">TODO</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg px-4 py-3">
            <div className="text-2xl font-semibold text-purple-700 dark:text-purple-300">
              {totalBacklog}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Backlog</div>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            <div className="text-2xl font-semibold text-red-700 dark:text-red-300">
              {totalBugs}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">Bugs</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
            <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
              {totalTodo + totalBacklog + totalBugs}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Time Range</label>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Chart Type</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as 'line' | 'area')}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="area">Stacked Area</option>
            <option value="line">Line</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        {loading ? (
          <div className="flex items-center justify-center h-80">
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <TrendsChart
            snapshots={snapshots}
            projectSlug={selectedProject || undefined}
            chartType={chartType}
          />
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          How it works
        </h3>
        <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <li>• Click "Create Snapshot" to capture current task counts</li>
          <li>• Create snapshots daily to track trends over time</li>
          <li>• Filter by project to see individual project trends</li>
          <li>• Use stacked area chart to see composition, line chart for comparison</li>
        </ul>
      </div>
    </main>
  )
}
