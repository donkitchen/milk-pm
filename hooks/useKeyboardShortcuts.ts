'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  ctrl?: boolean
  shift?: boolean
  meta?: boolean
}

const isInputElement = (element: EventTarget | null): boolean => {
  if (!element || !(element instanceof HTMLElement)) return false
  const tagName = element.tagName.toUpperCase()
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    element.isContentEditable
  )
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled = true
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Skip if user is typing in an input
      if (isInputElement(event.target)) return

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = !shortcut.ctrl || event.ctrlKey || event.metaKey
        const shiftMatch = !shortcut.shift || event.shiftKey
        const metaMatch = !shortcut.meta || event.metaKey

        if (keyMatch && ctrlMatch && shiftMatch && metaMatch) {
          event.preventDefault()
          shortcut.action()
          return
        }
      }
    },
    [shortcuts, enabled]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Default shortcuts hook for the app
export function useDefaultShortcuts(options: {
  onSearch?: () => void
  onQuickAdd?: () => void
  onHelp?: () => void
}) {
  const router = useRouter()

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'g',
      description: 'Go to dashboard',
      action: () => {
        // Wait for second key
        const handler = (e: KeyboardEvent) => {
          if (isInputElement(e.target)) return
          document.removeEventListener('keydown', handler)

          switch (e.key.toLowerCase()) {
            case 'h':
              e.preventDefault()
              router.push('/history')
              break
            case 'd':
              e.preventDefault()
              router.push('/')
              break
            case 's':
              e.preventDefault()
              router.push('/settings')
              break
            case 'a':
              e.preventDefault()
              router.push('/about')
              break
            case 't':
              e.preventDefault()
              router.push('/trends')
              break
          }
        }
        document.addEventListener('keydown', handler, { once: true })
        setTimeout(() => document.removeEventListener('keydown', handler), 1000)
      },
    },
    {
      key: '/',
      description: 'Focus search',
      action: () => options.onSearch?.(),
    },
    {
      key: 'q',
      description: 'Quick add task',
      action: () => options.onQuickAdd?.(),
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => options.onHelp?.(),
    },
  ]

  useKeyboardShortcuts(shortcuts)
}
