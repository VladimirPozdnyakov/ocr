'use client'

import type {
  DocumentChangedEvent,
  DocumentsChangedEvent,
  DownloadState,
  JobState,
  SnapshotEvent,
} from '@/lib/protocol'
import { logger } from '@/lib/logger'

type ServerEventMap = {
  snapshot: SnapshotEvent
  'documents.changed': DocumentsChangedEvent
  'document.changed': DocumentChangedEvent
  'job.changed': JobState
  'download.changed': DownloadState
}

type BinaryResult = {
  data: Uint8Array
  contentType: string
  filename?: string
}

type ProgressTarget = {
  setProgressBar: (options: { progress?: number }) => Promise<void>
}

const EVENT_NAMES = [
  'snapshot',
  'documents.changed',
  'document.changed',
  'job.changed',
  'download.changed',
] as const satisfies ReadonlyArray<keyof ServerEventMap>

const eventListeners = new Map<
  keyof ServerEventMap,
  Set<(payload: unknown) => void>
>()
const connectionListeners = new Set<(connected: boolean) => void>()

let eventSource: EventSource | null = null
let connected = false
let activePipelineJobId: string | null = null

const setConnected = (next: boolean) => {
  if (connected === next) return
  connected = next
  connectionListeners.forEach((listener) => listener(next))
}

const updateActivePipelineJob = (jobId: string | null) => {
  activePipelineJobId = jobId
}

const syncActivePipelineJobFromSnapshot = (payload: SnapshotEvent) => {
  const runningJob =
    payload.jobs.find(
      (job) => job.kind === 'pipeline' && job.status === 'running',
    ) ?? null
  updateActivePipelineJob(runningJob?.id ?? null)
}

const handleEventPayload = <K extends keyof ServerEventMap>(
  event: K,
  payload: ServerEventMap[K],
) => {
  if (event === 'snapshot') {
    syncActivePipelineJobFromSnapshot(payload as SnapshotEvent)
  }

  if (event === 'job.changed') {
    const job = payload as JobState
    if (job.kind === 'pipeline') {
      if (job.status === 'running') {
        updateActivePipelineJob(job.id)
      } else if (activePipelineJobId === job.id) {
        updateActivePipelineJob(null)
      }
    }
  }

  const listeners = eventListeners.get(event)
  if (!listeners?.size) return
  listeners.forEach((listener) => listener(payload))
}

const ensureEventSource = () => {
  if (eventSource || typeof window === 'undefined') return

  const next = new EventSource(`${getApiBaseUrl()}/events`)
  eventSource = next

  next.onopen = () => {
    setConnected(true)
  }

  next.onerror = () => {
    setConnected(false)
  }

  for (const eventName of EVENT_NAMES) {
    next.addEventListener(eventName, (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data)
        handleEventPayload(eventName, payload)
      } catch (error) {
        logger.error(`[backend] failed to parse ${eventName}`, error)
      }
    })
  }
}

const parseError = async (response: Response) => {
  const message = (await response.text()) || response.statusText
  return new Error(message || `Request failed with ${response.status}`)
}

const getApiOrigin = () => {
  if (typeof window !== 'undefined' && location.origin) {
    return location.origin
  }

  return 'http://127.0.0.1:3000'
}

export const getApiBaseUrl = () => `${getApiOrigin()}/api/v1`

export async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers)
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function fetchBinary(
  path: string,
  init?: RequestInit,
): Promise<BinaryResult> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, init)

  if (!response.ok) {
    throw await parseError(response)
  }

  const data = new Uint8Array(await response.arrayBuffer())
  const filename = parseContentDispositionFilename(
    response.headers.get('content-disposition'),
  )

  return {
    data,
    contentType:
      response.headers.get('content-type') ?? 'application/octet-stream',
    filename,
  }
}

export function getCurrentWindow(): ProgressTarget {
  return {
    async setProgressBar() {
      // No-op in browser mode
    },
  }
}

export function subscribeServerEvent<K extends keyof ServerEventMap>(
  event: K,
  cb: (payload: ServerEventMap[K]) => void,
): () => void {
  ensureEventSource()
  const listeners =
    eventListeners.get(event) ?? new Set<(payload: unknown) => void>()
  listeners.add(cb as (payload: unknown) => void)
  eventListeners.set(event, listeners)

  return () => {
    const current = eventListeners.get(event)
    if (!current) return
    current.delete(cb as (payload: unknown) => void)
    if (!current.size) {
      eventListeners.delete(event)
    }
  }
}

export const subscribeSnapshot = (cb: (payload: SnapshotEvent) => void) =>
  subscribeServerEvent('snapshot', cb)

export const subscribeDocumentsChanged = (
  cb: (payload: DocumentsChangedEvent) => void,
) => subscribeServerEvent('documents.changed', cb)

export const subscribeDocumentChanged = (
  cb: (payload: DocumentChangedEvent) => void,
) => subscribeServerEvent('document.changed', cb)

export const subscribeJobChanged = (cb: (payload: JobState) => void) =>
  subscribeServerEvent('job.changed', cb)

export const subscribeDownloadChanged = (
  cb: (payload: DownloadState) => void,
) => subscribeServerEvent('download.changed', cb)

export const subscribeRpcConnection = (
  cb: (nextConnected: boolean) => void,
): (() => void) => {
  ensureEventSource()
  connectionListeners.add(cb)
  cb(connected)

  return () => {
    connectionListeners.delete(cb)
  }
}

export const getActivePipelineJobId = () => activePipelineJobId

export const setActivePipelineJobId = (jobId: string | null) => {
  updateActivePipelineJob(jobId)
}

function parseContentDispositionFilename(
  contentDisposition: string | null,
): string | undefined {
  if (!contentDisposition) return undefined
  const match = contentDisposition.match(/filename="([^"]+)"/)
  return match?.[1]
}
