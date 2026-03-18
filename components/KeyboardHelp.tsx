'use client'

import { useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { category: 'Navigation', shortcuts: [
    { keys: ['g', 'd'], description: 'Go to Dashboard' },
    { keys: ['g', 'h'], description: 'Go to History' },
    { keys: ['g', 's'], description: 'Go to Settings' },
    { keys: ['g', 'a'], description: 'Go to About' },
  ]},
  { category: 'Actions', shortcuts: [
    { keys: ['/'], description: 'Focus search' },
    { keys: ['q'], description: 'Quick add task' },
    { keys: ['?'], description: 'Show this help' },
    { keys: ['Esc'], description: 'Close dialogs' },
  ]},
  { category: 'In Search/Results', shortcuts: [
    { keys: ['↑', '↓'], description: 'Navigate results' },
    { keys: ['Enter'], description: 'Select result' },
    { keys: ['Esc'], description: 'Close search' },
  ]},
]

export default function KeyboardHelp({ isOpen, onClose }: Props) {
  // Close on escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-modal]')) return
      onClose()
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        data-modal
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 max-w-lg w-full mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((section) => (
            <div key={section.category} className="mb-6 last:mb-0">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <span key={j} className="flex items-center gap-1">
                          {j > 0 && (
                            <span className="text-xs text-gray-400">then</span>
                          )}
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  )
}
