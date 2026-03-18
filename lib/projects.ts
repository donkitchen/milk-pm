import { getLists, getTasksForList, normalizeTaskSeries, RTMList } from './rtm'
import projectsConfig from '../projects.json'

// --- Types ---

export type ListRole = 'todo' | 'backlog' | 'bugs' | 'decisions' | 'context'

export interface ProjectConfig {
  slug: string
  name: string
  description?: string
  color: string
  url?: string
  convention?: string
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

// --- Public API ---

export function getProjectConfigs(): ProjectConfig[] {
  return projectsConfig.projects as ProjectConfig[]
}

export function getProjectBySlug(slug: string): ProjectConfig | undefined {
  return getProjectConfigs().find((p) => p.slug === slug)
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
          const rtmListName = config.lists[role]
          const rtmListId = listIndex.get(rtmListName.toLowerCase()) ?? null

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
        lastContext: null, // Phase 2: parse context list for timestamp
      }
    })
  )

  return summaries
}

export async function getProjectDetail(slug: string): Promise<ProjectSummary | null> {
  const config = getProjectBySlug(slug)
  if (!config) return null

  const rtmLists = await getLists()
  const listIndex = buildListIndex(rtmLists)

  const stats: ProjectListStat[] = await Promise.all(
    LIST_ROLES.map(async (role) => {
      const rtmListName = config.lists[role]
      const rtmListId = listIndex.get(rtmListName.toLowerCase()) ?? null

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
