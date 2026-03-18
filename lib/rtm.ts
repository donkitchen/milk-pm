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
  start: string
}

export interface RTMNote {
  id: string
  created: string
  modified: string
  title: string
  $t: string // Note content
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
  notes: { note: RTMNote[] } | string
  task: RTMTask | RTMTask[]
  // Extended fields for search results
  list_id?: string
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

// --- Search and filtering ---

export async function searchTasks(
  filter: string,
  options: { listId?: string; cache?: boolean } = {}
): Promise<RTMTaskSeries[]> {
  const params: Record<string, string> = { filter }
  if (options.listId) params.list_id = options.listId

  const fetchOptions = options.cache === false
    ? { cache: 'no-store' as const }
    : { next: { revalidate: 60 } }

  const rsp = await rtmRequestWithOptions<{ tasks: { list?: RTMTaskList | RTMTaskList[] } }>(
    'rtm.tasks.getList',
    params,
    fetchOptions
  )

  const lists = rsp.tasks.list
  if (!lists) return []

  const listArray = Array.isArray(lists) ? lists : [lists]

  // Flatten all task series from all lists, adding list_id for context
  return listArray.flatMap((list) => {
    const series = normalizeTaskSeries(list)
    return series.map((s) => ({ ...s, list_id: list.id }))
  })
}

// --- Task mutations ---

async function getTimeline(): Promise<string> {
  const rsp = await rtmRequestWithOptions<{ timeline: string }>(
    'rtm.timelines.create',
    {},
    { cache: 'no-store' }
  )
  return rsp.timeline
}

export async function addTask(params: {
  name: string
  listId?: string
  parse?: boolean
}): Promise<RTMTaskSeries> {
  const timeline = await getTimeline()

  const reqParams: Record<string, string> = {
    timeline,
    name: params.name,
    parse: params.parse !== false ? '1' : '0', // Enable smart parsing by default
  }
  if (params.listId) reqParams.list_id = params.listId

  const rsp = await rtmRequestWithOptions<{ list: RTMTaskList }>(
    'rtm.tasks.add',
    reqParams,
    { cache: 'no-store' }
  )

  const series = normalizeTaskSeries(rsp.list)
  if (series.length === 0) {
    throw new Error('Failed to add task: no task returned')
  }
  return series[0]
}

export async function completeTask(
  listId: string,
  taskseriesId: string,
  taskId: string
): Promise<void> {
  const timeline = await getTimeline()

  await rtmRequestWithOptions(
    'rtm.tasks.complete',
    {
      timeline,
      list_id: listId,
      taskseries_id: taskseriesId,
      task_id: taskId,
    },
    { cache: 'no-store' }
  )
}

export async function uncompleteTask(
  listId: string,
  taskseriesId: string,
  taskId: string
): Promise<void> {
  const timeline = await getTimeline()

  await rtmRequestWithOptions(
    'rtm.tasks.uncomplete',
    {
      timeline,
      list_id: listId,
      taskseries_id: taskseriesId,
      task_id: taskId,
    },
    { cache: 'no-store' }
  )
}

// --- Task editing ---

export async function setTaskName(
  listId: string,
  taskseriesId: string,
  taskId: string,
  name: string
): Promise<void> {
  const timeline = await getTimeline()

  await rtmRequestWithOptions(
    'rtm.tasks.setName',
    {
      timeline,
      list_id: listId,
      taskseries_id: taskseriesId,
      task_id: taskId,
      name,
    },
    { cache: 'no-store' }
  )
}

export async function setTaskPriority(
  listId: string,
  taskseriesId: string,
  taskId: string,
  priority: string // '1', '2', '3', or 'N' (none)
): Promise<void> {
  const timeline = await getTimeline()

  await rtmRequestWithOptions(
    'rtm.tasks.setPriority',
    {
      timeline,
      list_id: listId,
      taskseries_id: taskseriesId,
      task_id: taskId,
      priority: priority === 'N' ? '0' : priority,
    },
    { cache: 'no-store' }
  )
}

export async function setTaskDueDate(
  listId: string,
  taskseriesId: string,
  taskId: string,
  due: string // Empty string to clear, or date string
): Promise<void> {
  const timeline = await getTimeline()

  const params: Record<string, string> = {
    timeline,
    list_id: listId,
    taskseries_id: taskseriesId,
    task_id: taskId,
    parse: '1',
  }
  if (due) {
    params.due = due
  }

  await rtmRequestWithOptions('rtm.tasks.setDueDate', params, { cache: 'no-store' })
}

export async function setTaskEstimate(
  listId: string,
  taskseriesId: string,
  taskId: string,
  estimate: string // Empty string to clear, or duration like "1 hour", "30 min"
): Promise<void> {
  const timeline = await getTimeline()

  await rtmRequestWithOptions(
    'rtm.tasks.setEstimate',
    {
      timeline,
      list_id: listId,
      taskseries_id: taskseriesId,
      task_id: taskId,
      estimate,
    },
    { cache: 'no-store' }
  )
}

export async function setTaskURL(
  listId: string,
  taskseriesId: string,
  taskId: string,
  url: string // Empty string to clear
): Promise<void> {
  const timeline = await getTimeline()

  await rtmRequestWithOptions(
    'rtm.tasks.setURL',
    {
      timeline,
      list_id: listId,
      taskseries_id: taskseriesId,
      task_id: taskId,
      url,
    },
    { cache: 'no-store' }
  )
}

export async function addTaskTags(
  listId: string,
  taskseriesId: string,
  taskId: string,
  tags: string // Comma-separated tags
): Promise<void> {
  const timeline = await getTimeline()

  await rtmRequestWithOptions(
    'rtm.tasks.addTags',
    {
      timeline,
      list_id: listId,
      taskseries_id: taskseriesId,
      task_id: taskId,
      tags,
    },
    { cache: 'no-store' }
  )
}

export async function removeTaskTags(
  listId: string,
  taskseriesId: string,
  taskId: string,
  tags: string // Comma-separated tags
): Promise<void> {
  const timeline = await getTimeline()

  await rtmRequestWithOptions(
    'rtm.tasks.removeTags',
    {
      timeline,
      list_id: listId,
      taskseries_id: taskseriesId,
      task_id: taskId,
      tags,
    },
    { cache: 'no-store' }
  )
}

export async function addTaskNote(
  listId: string,
  taskseriesId: string,
  taskId: string,
  title: string,
  body: string
): Promise<RTMNote> {
  const timeline = await getTimeline()

  const rsp = await rtmRequestWithOptions<{ note: RTMNote }>(
    'rtm.tasks.notes.add',
    {
      timeline,
      list_id: listId,
      taskseries_id: taskseriesId,
      task_id: taskId,
      note_title: title,
      note_text: body,
    },
    { cache: 'no-store' }
  )

  return rsp.note
}

export async function deleteTaskNote(
  noteId: string
): Promise<void> {
  const timeline = await getTimeline()

  await rtmRequestWithOptions(
    'rtm.tasks.notes.delete',
    {
      timeline,
      note_id: noteId,
    },
    { cache: 'no-store' }
  )
}

// --- Core request with configurable fetch options ---

async function rtmRequestWithOptions<T = unknown>(
  method: string,
  params: Record<string, string> = {},
  fetchOptions: RequestInit & { next?: { revalidate: number } } = { next: { revalidate: 60 } }
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

  const res = await fetch(url, fetchOptions)
  if (!res.ok) throw new Error(`RTM HTTP error: ${res.status}`)

  const json = await res.json()
  if (json.rsp.stat !== 'ok') {
    throw new Error(`RTM API error: ${json.rsp.err?.msg ?? 'unknown'}`)
  }

  return json.rsp as T
}

// --- Helper functions ---

export function getFirstTask(series: RTMTaskSeries): RTMTask | null {
  if (!series.task) return null
  return Array.isArray(series.task) ? series.task[0] : series.task
}

export function getTags(series: RTMTaskSeries): string[] {
  if (!series.tags) return []
  if (typeof series.tags === 'string') return []
  return series.tags.tag ?? []
}

export function getNotes(series: RTMTaskSeries): RTMNote[] {
  if (!series.notes) return []
  if (typeof series.notes === 'string') return []
  return series.notes.note ?? []
}
