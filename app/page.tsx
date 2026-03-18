import Link from 'next/link'
import { getProjectSummaries } from '../lib/projects'
import ProjectCard from '../components/ProjectCard'
import StatBar from '../components/StatBar'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const summaries = await getProjectSummaries()

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10 sm:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            milk-pm
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Your RTM projects at a glance
          </p>
        </div>
        <Link
          href="/settings"
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Settings
        </Link>
      </div>

      {/* Stats */}
      <StatBar summaries={summaries} />

      {/* Project grid */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaries.map((summary) => (
            <ProjectCard key={summary.config.slug} summary={summary} />
          ))}
        </div>
      )}
    </main>
  )
}
