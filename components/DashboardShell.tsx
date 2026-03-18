'use client'

import { useState, useRef } from 'react'
import { useDefaultShortcuts } from '../hooks/useKeyboardShortcuts'
import KeyboardHelp from './KeyboardHelp'

interface Props {
  children: React.ReactNode
}

export default function DashboardShell({ children }: Props) {
  const [showHelp, setShowHelp] = useState(false)

  useDefaultShortcuts({
    onSearch: () => {
      // Focus the search input
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
      searchInput?.focus()
    },
    onQuickAdd: () => {
      // Focus the quick add input
      const quickAddInput = document.querySelector('[data-quickadd-input]') as HTMLInputElement
      quickAddInput?.focus()
    },
    onHelp: () => setShowHelp(true),
  })

  return (
    <>
      {children}
      <KeyboardHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Keyboard shortcut hint */}
      <button
        type="button"
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 p-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm transition-colors"
      >
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">?</kbd> for shortcuts
      </button>
    </>
  )
}
