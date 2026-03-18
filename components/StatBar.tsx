import { ProjectSummary } from '../lib/projects'

interface Props {
  summaries: ProjectSummary[]
}

export default function StatBar({ summaries }: Props) {
  const totalTodo = summaries.reduce(
    (sum, s) => sum + (s.stats.find((l) => l.role === 'todo')?.count ?? 0),
    0
  )
  const totalBacklog = summaries.reduce(
    (sum, s) => sum + (s.stats.find((l) => l.role === 'backlog')?.count ?? 0),
    0
  )
  const totalBugs = summaries.reduce(
    (sum, s) => sum + (s.stats.find((l) => l.role === 'bugs')?.count ?? 0),
    0
  )

  const stats = [
    { label: 'Projects',     value: summaries.length,  color: 'text-gray-700 dark:text-gray-200' },
    { label: 'Open TODOs',   value: totalTodo,          color: 'text-blue-700 dark:text-blue-300' },
    { label: 'Backlog',      value: totalBacklog,       color: 'text-gray-600 dark:text-gray-400' },
    { label: 'Open bugs',    value: totalBugs,          color: totalBugs > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-3 border border-gray-100 dark:border-gray-800"
        >
          <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
