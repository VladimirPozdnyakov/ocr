'use client'

import { directoryOpen, fileOpen, fileSave } from 'browser-fs-access'
import {
  fetchBinary,
  fetchJson,
  getActivePipelineJobId,
  setActivePipelineJobId,
} from '@/lib/backend'
import { reportRpcError } from '@/lib/errors'
import type {
  ApiKeyResponse,
  DocumentDetail,
  DocumentSummary,
  FontFaceInfo,
  JobState,
  MetaInfo,
  TextBlockPatch,
} from '@/lib/protocol'
import { Document, TextBlock } from '@/types'
import { toArrayBuffer } from '@/lib/util'

const documentDetailCache = new Map<string, DocumentDetail>()
const textBlockIdAliases = new Map<string, string>()

const isTempTextBlockId = (id?: string) => !!id && id.startsWith('temp:')

const textBlockAliasKey = (documentId: string, textBlockId: string) =>
  `${documentId}:${textBlockId}`

const resolveTextBlockIdAlias = (documentId: string, textBlockId?: string) => {
  if (!textBlockId) return undefined
  return (
    textBlockIdAliases.get(textBlockAliasKey(documentId, textBlockId)) ??
    textBlockId
  )
}

const rememberTextBlockAlias = (
  documentId: string,
  tempId: string | undefined,
  realId: string,
) => {
  if (!tempId || !isTempTextBlockId(tempId)) return
  textBlockIdAliases.set(textBlockAliasKey(documentId, tempId), realId)
}

const withRpcError = async <T>(
  method: string,
  fn: () => Promise<T>,
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    reportRpcError(method, error)
    throw error
  }
}

const getDocuments = async (): Promise<DocumentSummary[]> => {
  const documents = await fetchJson<DocumentSummary[]>('/documents')
  const prunedIds = new Set(documents.map((document) => document.id))
  for (const documentId of documentDetailCache.keys()) {
    if (!prunedIds.has(documentId)) {
      documentDetailCache.delete(documentId)
    }
  }
  return documents
}

const getDocumentSummaryAtIndex = async (index: number) => {
  const documents = await getDocuments()
  const summary = documents[index]
  if (!summary) {
    throw new Error(`Document not found at index ${index}`)
  }
  return summary
}

const getDocumentDetail = async (
  documentId: string,
): Promise<DocumentDetail> => {
  const detail = await fetchJson<DocumentDetail>(`/documents/${documentId}`)
  documentDetailCache.set(documentId, detail)
  return detail
}

const getCachedOrFetchDocumentDetail = async (documentId: string) =>
  documentDetailCache.get(documentId) ?? (await getDocumentDetail(documentId))

const fetchLayer = async (documentId: string, layer: string) => {
  const binary = await fetchBinary(`/documents/${documentId}/layers/${layer}`)
  return binary.data
}

const mapTextBlock = (
  block: DocumentDetail['textBlocks'][number],
): TextBlock => {
  console.log('[api] Mapping text block:', {
    id: block.id,
    detector: block.detector,
    hasText: !!block.text,
  })
  return {
    id: block.id,
    x: block.x,
    y: block.y,
    width: block.width,
    height: block.height,
    confidence: block.confidence,
    linePolygons: block.linePolygons ?? undefined,
    sourceDirection: block.sourceDirection ?? undefined,
    rotationDeg: block.rotationDeg ?? undefined,
    detectedFontSizePx: block.detectedFontSizePx ?? undefined,
    detector: block.detector ?? undefined,
    text: block.text ?? undefined,
    fontPrediction: block.fontPrediction ?? undefined,
  }
}

const toDocumentDetailBlock = (
  block: TextBlock,
  id: string,
): DocumentDetail['textBlocks'][number] => ({
  id,
  x: block.x,
  y: block.y,
  width: block.width,
  height: block.height,
  confidence: block.confidence,
  linePolygons: block.linePolygons ?? null,
  sourceDirection: block.sourceDirection ?? null,
  rotationDeg: block.rotationDeg ?? null,
  detectedFontSizePx: block.detectedFontSizePx ?? null,
  detector: block.detector ?? null,
  text: block.text ?? null,
  style: null,
  fontPrediction: block.fontPrediction ?? null,
})

const buildTextBlockPatch = (
  next: TextBlock,
  previous: DocumentDetail['textBlocks'][number],
): TextBlockPatch | null => {
  const patch: TextBlockPatch = {
    text: undefined,
    x: undefined,
    y: undefined,
    width: undefined,
    height: undefined,
  }

  if ((next.text ?? null) !== previous.text) {
    patch.text = next.text ?? ''
  }
  if (next.x !== previous.x) {
    patch.x = next.x
  }
  if (next.y !== previous.y) {
    patch.y = next.y
  }
  if (next.width !== previous.width) {
    patch.width = next.width
  }
  if (next.height !== previous.height) {
    patch.height = next.height
  }

  return Object.values(patch).some((value) => value !== undefined)
    ? patch
    : null
}

const createTextBlockRemotely = async (
  documentId: string,
  block: TextBlock,
) => {
  const created = await fetchJson<DocumentDetail['textBlocks'][number]>(
    `/documents/${documentId}/text-blocks`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
      }),
    },
  )

  const patch = buildTextBlockPatch(block, created)
  if (patch) {
    const updated = await fetchJson<DocumentDetail['textBlocks'][number]>(
      `/documents/${documentId}/text-blocks/${created.id}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      },
    )
    return updated
  }

  return created
}

export const createTempTextBlockId = () =>
  `temp:${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`

export const api = {
  async appVersion(): Promise<string> {
    const meta = await fetchJson<MetaInfo>('/meta')
    return meta.version
  },

  async deviceInfo(): Promise<{ mlDevice: string }> {
    const meta = await fetchJson<MetaInfo>('/meta')
    return { mlDevice: meta.mlDevice }
  },

  async openExternal(url: string): Promise<void> {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  },

  async getDocumentsCount(): Promise<number> {
    const documents = await getDocuments()
    return documents.length
  },

  async getDocument(index: number): Promise<Document> {
    return withRpcError('get_document', async () => {
      const summary = await getDocumentSummaryAtIndex(index)
      const detail = await getDocumentDetail(summary.id)
      const [image, segment] = await Promise.all([
        fetchLayer(summary.id, 'original'),
        summary.hasSegment
          ? fetchLayer(summary.id, 'segment')
          : Promise.resolve(undefined),
      ])

      return {
        id: detail.id,
        path: detail.path,
        name: detail.name,
        image,
        width: detail.width,
        height: detail.height,
        revision: detail.revision,
        textBlocks: detail.textBlocks.map(mapTextBlock),
        segment,
      }
    })
  },

  async getThumbnail(index: number): Promise<Blob> {
    return withRpcError('get_thumbnail', async () => {
      const summary = await getDocumentSummaryAtIndex(index)
      const binary = await fetchBinary(`/documents/${summary.id}/thumbnail`)
      return new Blob([toArrayBuffer(binary.data)], {
        type: binary.contentType,
      })
    })
  },

  async addDocuments(): Promise<number> {
    return withRpcError('add_documents', async () => {
      const files = await pickDocuments()
      if (!files?.length) return 0
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file, file.name))
      const result = await fetchJson<{ totalCount: number }>(
        '/documents/import?mode=append',
        {
          method: 'POST',
          body: formData,
        },
      )
      documentDetailCache.clear()
      return result.totalCount
    })
  },

  async openDocuments(): Promise<number> {
    return withRpcError('open_documents', async () => {
      const files = await pickDocuments()
      if (!files?.length) return 0
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file, file.name))
      const result = await fetchJson<{ totalCount: number }>(
        '/documents/import?mode=replace',
        {
          method: 'POST',
          body: formData,
        },
      )
      documentDetailCache.clear()
      return result.totalCount
    })
  },

  async openFolder(): Promise<number> {
    return withRpcError('open_documents', async () => {
      const files = await pickFolder()
      if (!files?.length) return 0
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file, file.name))
      const result = await fetchJson<{ totalCount: number }>(
        '/documents/import?mode=replace',
        {
          method: 'POST',
          body: formData,
        },
      )
      documentDetailCache.clear()
      return result.totalCount
    })
  },

  async addFolder(): Promise<number> {
    return withRpcError('add_documents', async () => {
      const files = await pickFolder()
      if (!files?.length) return 0
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file, file.name))
      const result = await fetchJson<{ totalCount: number }>(
        '/documents/import?mode=append',
        {
          method: 'POST',
          body: formData,
        },
      )
      documentDetailCache.clear()
      return result.totalCount
    })
  },

  async exportDocument(index: number): Promise<void> {
    return withRpcError('export_document', async () => {
      const summary = await getDocumentSummaryAtIndex(index)
      const detail = await getCachedOrFetchDocumentDetail(summary.id)
      const pageNum = index + 1
      const blockTexts = detail.textBlocks
        .map((block) => block.text ?? '')
        .filter((text) => text.length > 0)
      const text = `=== Страница ${pageNum} ===\n` + blockTexts.join('\n')

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      try {
        await fileSave(blob, {
          fileName: `${summary.name}_page${pageNum}_ocr.txt`,
        })
      } catch {
        // User cancelled the file save dialog
      }
    })
  },

  async exportAllDocuments(): Promise<void> {
    return withRpcError('export_all_documents', async () => {
      const documents = await getDocuments()
      if (documents.length === 0) return

      const parts: string[] = []
      for (let i = 0; i < documents.length; i++) {
        const summary = documents[i]
        const detail = await getCachedOrFetchDocumentDetail(summary.id)
        const pageNum = i + 1
        const blockTexts = detail.textBlocks
          .map((block) => block.text ?? '')
          .filter((text) => text.length > 0)
        if (blockTexts.length > 0 || i === 0) {
          parts.push(`=== Страница ${pageNum} ===`)
          parts.push(...blockTexts)
        }
      }

      const text = parts.join('\n')
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      try {
        await fileSave(blob, {
          fileName: 'all_pages_ocr.txt',
        })
      } catch {
        // User cancelled the file save dialog
      }
    })
  },

  async detect(index: number): Promise<void> {
    return withRpcError('detect', async () => {
      const summary = await getDocumentSummaryAtIndex(index)
      await fetchJson<void>(`/documents/${summary.id}/detect`, {
        method: 'POST',
      })
      documentDetailCache.delete(summary.id)
    })
  },

  async ocr(index: number): Promise<void> {
    return withRpcError('ocr', async () => {
      const summary = await getDocumentSummaryAtIndex(index)
      await fetchJson<void>(`/documents/${summary.id}/ocr`, { method: 'POST' })
      documentDetailCache.delete(summary.id)
    })
  },

  async updateTextBlocks(
    index: number,
    textBlocks: TextBlock[],
  ): Promise<void> {
    return withRpcError('update_text_blocks', async () => {
      const summary = await getDocumentSummaryAtIndex(index)
      const previous = await getCachedOrFetchDocumentDetail(summary.id)
      const previousMap = new Map(
        previous.textBlocks.map((block) => [block.id, block]),
      )

      const normalizedBlocks = textBlocks.map((block) => ({
        ...block,
        id: resolveTextBlockIdAlias(summary.id, block.id),
      }))

      const retainedIds = new Set(
        normalizedBlocks
          .map((block) => block.id)
          .filter((id): id is string => !!id && !isTempTextBlockId(id)),
      )

      for (const previousBlock of previous.textBlocks) {
        if (!retainedIds.has(previousBlock.id)) {
          await fetchJson<void>(
            `/documents/${summary.id}/text-blocks/${previousBlock.id}`,
            {
              method: 'DELETE',
            },
          )
        }
      }

      const synchronizedBlocks: DocumentDetail['textBlocks'] = []

      for (const block of normalizedBlocks) {
        const existingId =
          block.id && !isTempTextBlockId(block.id) ? block.id : undefined

        if (!existingId || !previousMap.has(existingId)) {
          const created = await createTextBlockRemotely(summary.id, block)
          rememberTextBlockAlias(summary.id, block.id, created.id)
          synchronizedBlocks.push(
            toDocumentDetailBlock({ ...block, id: created.id }, created.id),
          )
          continue
        }

        const previousBlock = previousMap.get(existingId)!
        const patch = buildTextBlockPatch(block, previousBlock)
        if (patch) {
          await fetchJson<DocumentDetail['textBlocks'][number]>(
            `/documents/${summary.id}/text-blocks/${existingId}`,
            {
              method: 'PATCH',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(patch),
            },
          )
        }

        synchronizedBlocks.push(toDocumentDetailBlock(block, existingId))
      }

      documentDetailCache.set(summary.id, {
        ...previous,
        textBlocks: synchronizedBlocks,
      })
    })
  },

  async listFonts(): Promise<FontFaceInfo[]> {
    return fetchJson<FontFaceInfo[]>('/fonts')
  },

  async getApiKey(provider: string): Promise<string | null> {
    const response = await fetchJson<ApiKeyResponse>(
      `/providers/${provider}/api-key`,
    )
    return response.apiKey ?? null
  },

  async setApiKey(provider: string, apiKey: string): Promise<void> {
    await fetchJson<void>(`/providers/${provider}/api-key`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    })
  },

  async process(options: { index?: number }): Promise<void> {
    return withRpcError('process', async () => {
      const documentId =
        typeof options.index === 'number'
          ? (await getDocumentSummaryAtIndex(options.index)).id
          : undefined

      const job = await fetchJson<JobState>('/jobs/pipeline', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          documentId,
        }),
      })
      setActivePipelineJobId(job.id)
    })
  },

  async processCancel(): Promise<void> {
    const jobId = getActivePipelineJobId()
    if (!jobId) return
    await fetchJson<void>(`/jobs/${jobId}`, { method: 'DELETE' })
  },
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

const pickDocuments = async (): Promise<File[] | null> => {
  try {
    return await fileOpen({
      description: 'Documents',
      mimeTypes: ['image/*'],
      extensions: IMAGE_EXTENSIONS,
      multiple: true,
    })
  } catch {
    return null
  }
}

const pickFolder = async (): Promise<File[] | null> => {
  try {
    const files = await directoryOpen({ recursive: true })
    return files.filter((file) =>
      IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)),
    )
  } catch {
    return null
  }
}
