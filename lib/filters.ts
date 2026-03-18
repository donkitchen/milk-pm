// Pre-built RTM filter strings for common queries
// See: https://www.rememberthemilk.com/help/?ctx=basics.search.advanced

export const RTM_FILTERS = {
  // Status filters
  incomplete: 'status:incomplete',
  completed: 'status:completed',

  // Due date filters
  overdue: 'dueBefore:today AND status:incomplete',
  dueToday: 'due:today AND status:incomplete',
  dueTomorrow: 'due:tomorrow AND status:incomplete',
  dueThisWeek: 'dueWithin:"1 week" AND status:incomplete',
  dueNextWeek: 'dueAfter:"1 week" AND dueBefore:"2 weeks" AND status:incomplete',
  noDueDate: 'due:never AND status:incomplete',

  // Priority filters
  priority1: 'priority:1 AND status:incomplete',
  priority2: 'priority:2 AND status:incomplete',
  priority3: 'priority:3 AND status:incomplete',
  noPriority: 'priority:none AND status:incomplete',
  highPriority: '(priority:1 OR priority:2) AND status:incomplete',

  // Time-based filters
  completedToday: 'status:completed AND completedWithin:"1 day"',
  completedThisWeek: 'status:completed AND completedWithin:"1 week"',
  completedThisMonth: 'status:completed AND completedWithin:"1 month"',
  addedToday: 'addedWithin:"1 day"',
  addedThisWeek: 'addedWithin:"1 week"',
  recentlyModified: 'updatedWithin:"1 day"',

  // Task properties
  hasNotes: 'hasNotes:true AND status:incomplete',
  hasEstimate: 'hasTimeEstimate:true AND status:incomplete',
  hasSubtasks: 'hasSubtasks:true AND status:incomplete',
  isSubtask: 'isSubtask:true AND status:incomplete',
  isRepeating: 'isRepeating:true AND status:incomplete',

  // Focus filters (useful for "what should I work on now?")
  focusNow: '(dueBefore:tomorrow OR priority:1) AND status:incomplete',
  urgent: '(dueBefore:today OR (due:today AND priority:1)) AND status:incomplete',
} as const

export type RTMFilterKey = keyof typeof RTM_FILTERS

// Build a search filter for text queries
export function buildSearchFilter(query: string, includeCompleted = false): string {
  const escapedQuery = query.replace(/"/g, '\\"')
  const statusFilter = includeCompleted ? '' : ' AND status:incomplete'
  return `(name:"${escapedQuery}" OR noteContains:"${escapedQuery}")${statusFilter}`
}

// Build a filter for a specific list
export function buildListFilter(listName: string, additionalFilter?: string): string {
  const base = `list:"${listName}"`
  return additionalFilter ? `${base} AND ${additionalFilter}` : base
}

// Combine multiple filters with AND
export function combineFilters(...filters: string[]): string {
  return filters.filter(Boolean).join(' AND ')
}

// Combine multiple filters with OR
export function orFilters(...filters: string[]): string {
  return `(${filters.filter(Boolean).join(' OR ')})`
}
