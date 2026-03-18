'use client'

import Link from 'next/link'
import { ProjectSummary, ListRole } from '../lib/projects'
import { LIST_ROLE_META } from '../types/projects'

const COLOR_CLASSES: Record<string, string> = {
  blue:   'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  teal:   'bg-teal-50 border-teal-200 dark:bg-teal-950 dark:border-teal-800',
  purple: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
  amber:  'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
  green:  'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
  red:    'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  gray:   'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700',
}

const PILL_CLASSES: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  gray:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  red:    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  teal:   'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
}

interface Props {
  summary: ProjectSummary
}

export default function ProjectCard({ summary }: Props) {
  const { config, stats, totalOpen } = summary
  const cardColor = COLOR_CLASSES[config.color] ?? COLOR_CLASSES.gray
  const bugCount = stats.find((s) => s.role === 'bugs')?.count ?? 0

  return (
    <Link href={`/project/${config.slug}`} className="block group">
      <div
        className={`rounded-xl border p-5 transition-all duration-150 group-hover:shadow-md ${cardColor}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {config.name}
              </h2>
              {config.category && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {config.category}
                </span>
              )}
            </div>
            {config.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {config.description}
              </p>
            )}
          </div>
          {bugCount > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
              {bugCount} bug{bugCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* List pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {stats
            .filter((s) => s.role !== 'context')
            .map((s) => {
              const meta = LIST_ROLE_META[s.role as ListRole]
              const pillColor = PILL_CLASSES[meta.color] ?? PILL_CLASSES.gray
              return (
                <span
                  key={s.role}
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${pillColor}`}
                >
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                  <span className="font-bold">{s.count}</span>
                </span>
              )
            })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{totalOpen} open items</span>
          {config.url && (
            <a
              href={config.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ↗ repo
            </a>
          )}
        </div>
      </div>
    </Link>
  )
}
