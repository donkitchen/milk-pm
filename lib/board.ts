// Board/Kanban helpers for milk-schema s: status tags

export type BoardColumn = 'inbox' | 'todo' | 'active' | 'blocked' | 'review' | 'done'

export const BOARD_COLUMNS: BoardColumn[] = ['inbox', 'todo', 'active', 'blocked', 'review', 'done']

export const COLUMN_META: Record<BoardColumn, { label: string; emoji: string; color: string }> = {
  inbox: { label: 'Inbox', emoji: '📥', color: 'bg-gray-100 dark:bg-gray-800' },
  todo: { label: 'Todo', emoji: '📋', color: 'bg-blue-50 dark:bg-blue-900/20' },
  active: { label: 'Active', emoji: '🔨', color: 'bg-yellow-50 dark:bg-yellow-900/20' },
  blocked: { label: 'Blocked', emoji: '🚧', color: 'bg-red-50 dark:bg-red-900/20' },
  review: { label: 'Review', emoji: '👀', color: 'bg-purple-50 dark:bg-purple-900/20' },
  done: { label: 'Done', emoji: '✅', color: 'bg-green-50 dark:bg-green-900/20' },
}

// Extract status from tags (s:xxx format)
export function getStatusFromTags(tags: string[]): BoardColumn {
  for (const tag of tags) {
    if (tag.startsWith('s:')) {
      const status = tag.slice(2) as BoardColumn
      if (BOARD_COLUMNS.includes(status)) {
        return status
      }
    }
  }
  // Default to inbox if no status tag found
  return 'inbox'
}

// Get the s: tag to add/remove for a status
export function getStatusTag(status: BoardColumn): string {
  return `s:${status}`
}
