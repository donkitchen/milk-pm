import { RTMTaskSeries } from '../lib/rtm'
import { ListRole } from '../lib/projects'
import { LIST_ROLE_META } from '../types/projects'

interface Props {
  role: ListRole
  tasks: RTMTaskSeries[]
}

const PRIORITY_LABEL: Record<string, string> = {
  '1': '🔴',
  '2': '🟡',
  '3': '🔵',
  N: '',
}

function getTags(series: RTMTaskSeries): string[] {
  if (!series.tags) return []
  if (typeof series.tags === 'string') return []
  if (Array.isArray(series.tags.tag)) return series.tags.tag
  if (typeof series.tags.tag === 'string') return [series.tags.tag]
  return []
}

function getDueDate(series: RTMTaskSeries): string | null {
  const task = Array.isArray(series.task) ? series.task[0] : series.task
  if (!task?.due) return null
  return task.due
}

function getPriority(series: RTMTaskSeries): string {
  const task = Array.isArray(series.task) ? series.task[0] : series.task
  return task?.priority ?? 'N'
}

function formatDue(due: string): { label: string; overdue: boolean } {
  const d = new Date(due)
  const now = new Date()
  const overdue = d < now
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { label, overdue }
}

export default function TaskList({ role, tasks }: Props) {
  const meta = LIST_ROLE_META[role]

  if (tasks.length === 0) {
    return (
      <div className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
        No items in {meta.label}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {tasks.map((series) => {
        const due = getDueDate(series)
        const priority = getPriority(series)
        const tags = getTags(series)
        const priorityIcon = PRIORITY_LABEL[priority] ?? ''
        const dueInfo = due ? formatDue(due) : null

        return (
          <li
            key={series.id}
            className="flex items-start gap-3 py-3 text-sm"
          >
            {/* Priority dot */}
            <span className="mt-0.5 text-xs w-4 shrink-0">{priorityIcon}</span>

            {/* Name + tags */}
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 dark:text-gray-200 truncate">
                {series.name}
              </p>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Due date */}
            {dueInfo && (
              <span
                className={`text-xs shrink-0 mt-0.5 font-medium ${
                  dueInfo.overdue
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {dueInfo.label}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
