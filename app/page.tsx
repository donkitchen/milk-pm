import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'View all your projects and tasks at a glance',
}
import { getProjectSummaries } from '../lib/projects'
import ProjectCard from '../components/ProjectCard'
import StatBar from '../components/StatBar'
import DueSection from '../components/DueSection'
import SearchBar from '../components/SearchBar'
import QuickAdd from '../components/QuickAdd'
import DashboardShell from '../components/DashboardShell'
import ActivityFeed from '../components/ActivityFeed'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const summaries = await getProjectSummaries()

  return (
    <DashboardShell>
      <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10 sm:px-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              milk-pm
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Your RTM projects at a glance
            </p>
          </div>
          <div className="flex-1 sm:max-w-md sm:ml-auto">
            <SearchBar />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/history"
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              History
            </Link>
            <Link
              href="/trends"
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Trends
            </Link>
            <Link
              href="/about"
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              About
            </Link>
            <Link
              href="/settings"
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Stats */}
        <StatBar summaries={summaries} />

        {/* Quick Add */}
        <div className="mb-6">
          <QuickAdd />
        </div>

        {/* Due Date Sections */}
        <DueSection />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects - takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            {summaries.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-gray-600">
                <p className="text-lg">No projects enabled.</p>
                <p className="text-sm mt-2">
                  Go to{' '}
                  <Link href="/settings" className="text-blue-500 hover:underline">
                    Settings
                  </Link>{' '}
                  to enable your milk-mcp projects.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {summaries.map((summary) => (
                  <ProjectCard key={summary.config.slug} summary={summary} />
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed - sidebar on large screens */}
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </main>
    </DashboardShell>
  )
}
