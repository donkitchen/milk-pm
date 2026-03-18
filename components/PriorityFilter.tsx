'use client'

export type PriorityValue = '1' | '2' | '3' | 'N' | 'all'

interface Props {
  value: PriorityValue
  onChange: (value: PriorityValue) => void
  counts?: Record<string, number>
}

const PRIORITIES: { value: PriorityValue; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  { value: '1', label: 'P1', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  { value: '2', label: 'P2', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
  { value: '3', label: 'P3', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  { value: 'N', label: 'None', color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500' },
]

export default function PriorityFilter({ value, onChange, counts }: Props) {
  return (
    <div className="flex items-center gap-1">
      {PRIORITIES.map((p) => {
        const isActive = value === p.value
        const count = p.value === 'all'
          ? undefined
          : counts?.[p.value]

        return (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            className={`
              px-2 py-1 text-xs font-medium rounded-md transition-all
              ${isActive
                ? `${p.color} ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-600 dark:ring-offset-gray-950`
                : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            {p.label}
            {count !== undefined && count > 0 && (
              <span className="ml-1 opacity-70">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
