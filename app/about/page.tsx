import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10 sm:px-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6"
      >
        ← Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          About milk-pm
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          A configurable project dashboard for Remember The Milk
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            What is milk-pm?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            milk-pm is a web dashboard that transforms your Remember The Milk (RTM) lists into
            a powerful project management view. It works out of the box with{' '}
            <a
              href="https://github.com/donkitchen/milk-mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              milk-mcp
            </a>{' '}
            conventions but supports custom list mappings for any workflow.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Features
          </h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Project Dashboard:</strong> See all your projects at a glance with task counts for TODO, Backlog, and Bugs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Due Date Views:</strong> Collapsible sections for overdue, due today, and due this week tasks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Real-Time Search:</strong> Instantly find tasks across all projects (press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">/</kbd>)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Quick Add:</strong> Add tasks with smart parsing for dates, priorities, and tags (press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">q</kbd>)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Project Customization:</strong> Set colors, descriptions, categories, and repository links</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>milk-mcp Integration:</strong> Auto-discovers projects using the CC: naming convention</span>
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            milk-mcp Convention
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
            milk-pm automatically discovers projects that follow the milk-mcp list naming pattern:
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 font-mono text-sm">
            <div className="text-gray-600 dark:text-gray-400">CC: project-name - TODO</div>
            <div className="text-gray-600 dark:text-gray-400">CC: project-name - Backlog</div>
            <div className="text-gray-600 dark:text-gray-400">CC: project-name - Bugs</div>
            <div className="text-gray-600 dark:text-gray-400">CC: project-name - Decisions</div>
            <div className="text-gray-600 dark:text-gray-400">CC: project-name - Context</div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Keyboard Shortcuts
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-mono">/</kbd>
              <span className="text-gray-600 dark:text-gray-400">Focus search</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-mono">q</kbd>
              <span className="text-gray-600 dark:text-gray-400">Quick add task</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-mono">Esc</kbd>
              <span className="text-gray-600 dark:text-gray-400">Close dialogs</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-mono">↑↓</kbd>
              <span className="text-gray-600 dark:text-gray-400">Navigate results</span>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Open Source
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            milk-pm is open source and available on GitHub. Contributions, issues, and feature requests are welcome!
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/donkitchen/milk-pm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              milk-pm on GitHub
            </a>
            <a
              href="https://github.com/donkitchen/milk-mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              milk-mcp on GitHub
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Credits
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Built with{' '}
            <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Next.js</a>,{' '}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Supabase</a>, and the{' '}
            <a href="https://www.rememberthemilk.com/services/api/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Remember The Milk API</a>.
          </p>
        </section>
      </div>
    </main>
  )
}
