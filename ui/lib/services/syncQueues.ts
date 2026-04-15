'use client'

import PQueue from 'p-queue'
import { TextBlock } from '@/types'
import { logger } from '@/lib/logger'

type TextBlockPayload = {
  index: number
  textBlocks: TextBlock[]
}

const textBlockQueue = new PQueue({ concurrency: 1 })

let textBlockPending: TextBlockPayload | null = null
let textBlockScheduled = false
let textBlockTask: Promise<void> | null = null

const scheduleTextBlockFlush = () => {
  if (textBlockScheduled) return
  textBlockScheduled = true
  textBlockTask = textBlockQueue.add(async () => {
    try {
      while (textBlockPending) {
        const payload = textBlockPending
        textBlockPending = null
        // Get the document ID from the cache first
        const cacheKey = `/api/v1/documents`
        const documentsResponse = await fetch(cacheKey)
        if (!documentsResponse.ok) {
          logger.error('Failed to fetch documents list')
          return
        }
        const documents = await documentsResponse.json()
        const document = documents[payload.index]
        if (!document) {
          logger.error(`Document with index ${payload.index} not found`)
          return
        }

        logger.info('[syncQueues] Syncing text blocks for document', {
          index: payload.index,
          documentId: document.id,
          textBlocksCount: payload.textBlocks.length,
        })

        const _response = await fetch(
          `/api/v1/documents/${document.id}/text-blocks`,
          {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload.textBlocks),
          },
        )
      }
    } finally {
      textBlockScheduled = false
      if (textBlockPending) {
        scheduleTextBlockFlush()
      }
    }
  })
}

export const enqueueTextBlockSync = (
  index: number,
  textBlocks: TextBlock[],
) => {
  textBlockPending = {
    index,
    textBlocks,
  }
  scheduleTextBlockFlush()
  return textBlockTask ?? Promise.resolve()
}

export const flushTextBlockSync = async () => {
  if (textBlockPending) {
    scheduleTextBlockFlush()
  }
  await textBlockQueue.onIdle()
}

export const flushAllSyncQueues = async () => {
  await flushTextBlockSync()
}
