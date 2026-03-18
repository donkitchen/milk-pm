import { createClient } from '@supabase/supabase-js'
import { getLists, getTasksForList, normalizeTaskSeries, RTMList } from './rtm'
import { DB_SCHEMA, TABLE_PROJECT_CONFIGS } from './supabase/config'

// --- Types ---

export type ListRole = 'todo' | 'backlog' | 'bugs' | 'decisions' | 'context'

export interface ProjectConfig {
  slug: string
  name: string
  description?: string
  color: string
  url?: string
  repo_url?: string
  convention?: string
  category?: string
  display_order?: number
  lists: Record<ListRole, string>
}

export interface ProjectListStat {
  role: ListRole
  rtmListName: string
  rtmListId: string | null
  count: number
}

export interface ProjectSummary {
  config: ProjectConfig
  stats: ProjectListStat[]
  totalOpen: number
  lastContext: string | null
}

// --- Helpers ---

const LIST_ROLES: ListRole[] = ['todo', 'backlog', 'bugs', 'decisions', 'context']

function buildListIndex(rtmLists: RTMList[]): Map<string, string> {
  const index = new Map<string, string>()
  for (const list of rtmLists) {
    index.set(list.name.toLowerCase(), list.id)
  }
  return index
}

// Create a service client for server-side reads (no auth context needed)
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: DB_SCHEMA } }
  )
}

// --- Public API ---

export async function getProjectConfigs(): Promise<ProjectConfig[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from(TABLE_PROJECT_CONFIGS)
    .select('slug, name, description, color, url, repo_url, convention, category, display_order, lists')
    .order('display_order', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Failed to fetch project configs:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    color: row.color,
    url: row.url ?? undefined,
    repo_url: row.repo_url ?? undefined,
    convention: row.convention ?? 'milk-mcp',
    category: row.category ?? undefined,
    display_order: row.display_order ?? undefined,
    lists: row.lists as Record<ListRole, string>,
  }))
}

export async function getProjectBySlug(slug: string): Promise<ProjectConfig | undefined> {
  const configs = await getProjectConfigs()
  return configs.find((p) => p.slug === slug)
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  const [configs, rtmLists] = await Promise.all([
    getProjectConfigs(),
    getLists(),
  ])

  const listIndex = buildListIndex(rtmLists)

  const summaries = await Promise.all(
    configs.map(async (config) => {
      const stats: ProjectListStat[] = await Promise.all(
        LIST_ROLES.map(async (role) => {
          const rtmListName = config.lists?.[role] ?? ''
          const rtmListId = rtmListName ? (listIndex.get(rtmListName.toLowerCase()) ?? null) : null

          let count = 0
          if (rtmListId) {
            const taskList = await getTasksForList(rtmListId)
            count = normalizeTaskSeries(taskList).length
          }

          return { role, rtmListName, rtmListId, count }
        })
      )

      const totalOpen =
        (stats.find((s) => s.role === 'todo')?.count ?? 0) +
        (stats.find((s) => s.role === 'backlog')?.count ?? 0)

      return {
        config,
        stats,
        totalOpen,
        lastContext: null,
      }
    })
  )

  return summaries
}

export async function getProjectDetail(slug: string): Promise<ProjectSummary | null> {
  const config = await getProjectBySlug(slug)
  if (!config) return null

  const rtmLists = await getLists()
  const listIndex = buildListIndex(rtmLists)

  const stats: ProjectListStat[] = await Promise.all(
    LIST_ROLES.map(async (role) => {
      const rtmListName = config.lists?.[role] ?? ''
      const rtmListId = rtmListName ? (listIndex.get(rtmListName.toLowerCase()) ?? null) : null

      let count = 0
      if (rtmListId) {
        const taskList = await getTasksForList(rtmListId)
        count = normalizeTaskSeries(taskList).length
      }

      return { role, rtmListName, rtmListId, count }
    })
  )

  const totalOpen =
    (stats.find((s) => s.role === 'todo')?.count ?? 0) +
    (stats.find((s) => s.role === 'backlog')?.count ?? 0)

  return { config, stats, totalOpen, lastContext: null }
}
