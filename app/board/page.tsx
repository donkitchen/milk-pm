import type { Metadata } from 'next'
import Link from 'next/link'
import KanbanBoard from '../../components/KanbanBoard'

export const metadata: Metadata = {
  title: 'Board',
  description: 'Kanban board view of all tasks',
}

export const dynamic = 'force-dynamic'

export default function BoardPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-6 sm:px-8">
      {/* Header */}
      <div className="max-w-full mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              ← Dashboard
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Kanban Board
            </h1>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Drag tasks to change status
          </p>
        </div>
      </div>

      {/* Board */}
      <KanbanBoard />
    </main>
  )
}
