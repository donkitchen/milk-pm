import crypto from 'crypto'

const RTM_API_BASE = 'https://api.rememberthemilk.com/services/rest/'
const RTM_API_KEY = process.env.RTM_API_KEY!
const RTM_SHARED_SECRET = process.env.RTM_SHARED_SECRET!
const RTM_AUTH_TOKEN = process.env.RTM_AUTH_TOKEN!

// --- Types ---

export interface RTMList {
  id: string
  name: string
  deleted: string
  locked: string
  archived: string
  position: string
  smart: string
}

export interface RTMTask {
  id: string
  due: string
  has_due_time: string
  added: string
  completed: string
  deleted: string
  priority: string
  postponed: string
  estimate: string
}

export interface RTMTaskSeries {
  id: string
  created: string
  modified: string
  name: string
  source: string
  url: string
  location_id: string
  tags: { tag: string[] } | string
  participants: unknown
  notes: unknown
  task: RTMTask | RTMTask[]
}

export interface RTMTaskList {
  id: string
  taskseries?: RTMTaskSeries | RTMTaskSeries[]
}

// --- Signing ---

function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('')
  return crypto
    .createHash('md5')
    .update(RTM_SHARED_SECRET + sorted)
    .digest('hex')
}

// --- Core request ---

export async function rtmRequest<T = unknown>(
  method: string,
  params: Record<string, string> = {}
): Promise<T> {
  const allParams: Record<string, string> = {
    method,
    api_key: RTM_API_KEY,
    auth_token: RTM_AUTH_TOKEN,
    format: 'json',
    ...params,
  }
  allParams.api_sig = sign(allParams)

  const url =
    RTM_API_BASE +
    '?' +
    new URLSearchParams(allParams).toString()

  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`RTM HTTP error: ${res.status}`)

  const json = await res.json()
  if (json.rsp.stat !== 'ok') {
    throw new Error(`RTM API error: ${json.rsp.err?.msg ?? 'unknown'}`)
  }

  return json.rsp as T
}

// --- API methods ---

export async function getLists(): Promise<RTMList[]> {
  const rsp = await rtmRequest<{ lists: { list: RTMList[] } }>('rtm.lists.getList')
  return rsp.lists.list.filter((l) => l.deleted === '0' && l.archived === '0')
}

export async function getTasksForList(listId: string): Promise<RTMTaskList> {
  const rsp = await rtmRequest<{ tasks: { list?: RTMTaskList | RTMTaskList[] } }>(
    'rtm.tasks.getList',
    { list_id: listId, filter: 'status:incomplete' }
  )

  const lists = rsp.tasks.list
  if (!lists) return { id: listId }

  const listArray = Array.isArray(lists) ? lists : [lists]
  return listArray.find((l) => l.id === listId) ?? { id: listId }
}

export function normalizeTaskSeries(
  list: RTMTaskList
): RTMTaskSeries[] {
  if (!list.taskseries) return []
  return Array.isArray(list.taskseries) ? list.taskseries : [list.taskseries]
}
