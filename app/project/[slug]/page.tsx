import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProjectDetail } from '../../../lib/projects'
import { getTasksForList, normalizeTaskSeries } from '../../../lib/rtm'
import TaskList from '../../../components/TaskList'
import { LIST_ROLE_META } from '../../../types/projects'
import { ListRole } from '../../../lib/projects'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const detail = await getProjectDetail(slug)
  if (!detail) notFound()

  const { config, stats } = detail

  // Fetch actual tasks for each list that has an RTM list ID
  const tasksByRole = Object.fromEntries(
    await Promise.all(
      stats.map(async (s) => {
        if (!s.rtmListId) return [s.role, []]
        const list = await getTasksForList(s.rtmListId)
        return [s.role, normalizeTaskSeries(list)]
      })
    )
  )

  const roles: ListRole[] = ['todo', 'backlog', 'bugs', 'decisions', 'context']

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10 sm:px-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6"
      >
        ← All projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {config.name}
          </h1>
          {config.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {config.description}
            </p>
          )}
        </div>
        {config.url && (
          <a
            href={config.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mt-1"
          >
            ↗ repo
          </a>
        )}
      </div>

      {/* Lists */}
      <div className="space-y-8">
        {roles.map((role) => {
          const meta = LIST_ROLE_META[role]
          const tasks = tasksByRole[role] ?? []
          const stat = stats.find((s) => s.role === role)

          return (
            <section key={role}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{meta.emoji}</span>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {meta.label}
                </h2>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {tasks.length}
                </span>
                {!stat?.rtmListId && (
                  <span className="text-xs text-amber-500 dark:text-amber-400 ml-1">
                    list not found in RTM
                  </span>
                )}
              </div>
              <div className="border border-gray-100 dark:border-gray-800 rounded-lg px-4">
                <TaskList role={role} tasks={tasks} />
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
