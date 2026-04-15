'use client'

import PQueue from 'p-queue'
import { TextBlock } from '@/types'
import { api } from '@/lib/api'
import { logger } from '@/lib/logger'

type TextBlockPayload = {
  index: number
  textBlocks: TextBlock[]
}

const DEBOUNCE_MS = 500

const textBlockQueue = new PQueue({ concurrency: 1 })

let textBlockPending: TextBlockPayload | null = null
let textBlockDebounceTimer: ReturnType<typeof setTimeout> | null = null
let textBlockScheduled = false
let textBlockTask: Promise<void> | null = null

const flushTextBlockQueue = () => {
  if (textBlockScheduled) return
  textBlockScheduled = true
  textBlockTask = textBlockQueue.add(async () => {
    try {
      while (textBlockPending) {
        const payload = textBlockPending
        textBlockPending = null

        logger.info('[syncQueues] Syncing text blocks for document', {
          index: payload.index,
          textBlocksCount: payload.textBlocks.length,
        })

        await api.updateTextBlocks(payload.index, payload.textBlocks)
      }
    } catch (error) {
      logger.error('[syncQueues] Failed to sync text blocks', error)
    } finally {
      textBlockScheduled = false
      if (textBlockPending) {
        flushTextBlockQueue()
      }
    }
  })
}

export const enqueueTextBlockSync = (
  index: number,
  textBlocks: TextBlock[],
) => {
  textBlockPending = { index, textBlocks }

  if (textBlockDebounceTimer) {
    clearTimeout(textBlockDebounceTimer)
  }

  textBlockDebounceTimer = setTimeout(() => {
    textBlockDebounceTimer = null
    flushTextBlockQueue()
  }, DEBOUNCE_MS)

  return textBlockTask ?? Promise.resolve()
}

export const flushTextBlockSync = async () => {
  if (textBlockDebounceTimer) {
    clearTimeout(textBlockDebounceTimer)
    textBlockDebounceTimer = null
  }
  if (textBlockPending) {
    flushTextBlockQueue()
  }
  await textBlockQueue.onIdle()
}

export const flushAllSyncQueues = async () => {
  await flushTextBlockSync()
}
