import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'milk-pm',
    template: '%s | milk-pm',
  },
  description: 'Your projects, remembered. A project management dashboard for Remember The Milk.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/milktools-mascot.jpg"
                alt="milk.tools"
                className="w-8 h-8 rounded-full"
              />
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">milk-pm</span>
                <span className="hidden sm:inline text-sm text-gray-400 dark:text-gray-500 ml-2">
                  Your projects, remembered.
                </span>
              </div>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/today"
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Today
              </Link>
              <Link
                href="/board"
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Board
              </Link>
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
            </nav>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1">{children}</div>

        {/* Footer */}
        <footer className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
            <a
              href="https://milk.tools"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <img
                src="/milktools-mascot.jpg"
                alt="milk.tools"
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm">milk.tools</span>
            </a>
          </div>
        </footer>
      </body>
    </html>
  )
}
