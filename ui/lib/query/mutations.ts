'use client'

import type { DocumentDetail } from '@/lib/protocol'
import { useCallback } from 'react'
import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getCurrentWindow } from '@/lib/backend'
import { TextBlock } from '@/types'
import { useEditorUiStore } from '@/lib/stores/editorUiStore'
import { useOperationStore } from '@/lib/stores/operationStore'
import { queryKeys } from '@/lib/query/keys'
import { logger } from '@/lib/logger'
import { saveTextBlocksToStorage } from '@/lib/services/localStorage'
import { useToast } from '@/hooks/useToast'

const invalidateCurrentDocument = async (
  queryClient: QueryClient,
  index: number,
) => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.documents.current(index),
  })
}

const invalidateThumbnailAtIndex = async (
  queryClient: QueryClient,
  index: number,
) => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.documents.thumbnailRoot,
    predicate: (query) => query.queryKey[3] === index,
  })
}

export const useProgressActions = () => {
  const setProgress = useCallback(async (progress?: number) => {
    await getCurrentWindow().setProgressBar({ progress })
  }, [])

  const clearProgress = useCallback(async () => {
    await getCurrentWindow().setProgressBar({ progress: 0 })
  }, [])

  return {
    setProgress,
    clearProgress,
  }
}

export const useTextBlockMutations = () => {
  const queryClient = useQueryClient()

  const updateTextBlocks = useCallback(
    async (textBlocks: TextBlock[]) => {
      const { currentDocumentIndex } = useEditorUiStore.getState()
      const queryKey = queryKeys.documents.current(currentDocumentIndex)
      void queryClient.cancelQueries({ queryKey })
      const currentDocument = queryClient.getQueryData<DocumentDetail>(queryKey)
      if (!currentDocument) return
      queryClient.setQueryData(queryKey, {
        ...currentDocument,
        textBlocks,
      } as DocumentDetail)
      saveTextBlocksToStorage(currentDocumentIndex, textBlocks as unknown[])
    },
    [queryClient],
  )

  return {
    updateTextBlocks,
  }
}

export const useMaskMutations = () => {
  const queryClient = useQueryClient()

  const updateMask = useCallback(
    async (mask: Uint8Array) => {
      const { currentDocumentIndex } = useEditorUiStore.getState()
      const queryKey = queryKeys.documents.current(currentDocumentIndex)
      const currentDocument = queryClient.getQueryData<DocumentDetail>(queryKey)
      if (!currentDocument) return

      queryClient.setQueryData(queryKey, {
        ...currentDocument,
        segment: mask,
      })
    },
    [queryClient],
  )

  return {
    updateMask,
  }
}

export const useDocumentMutations = () => {
  const queryClient = useQueryClient()
  const { setProgress, clearProgress } = useProgressActions()
  const { toast } = useToast()

  const refreshDocuments = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.documents.currentRoot,
    })
    await queryClient.invalidateQueries({
      queryKey: queryKeys.documents.thumbnailRoot,
    })
  }, [queryClient])

  const refreshCurrentDocument = useCallback(async () => {
    const { currentDocumentIndex } = useEditorUiStore.getState()
    await invalidateCurrentDocument(queryClient, currentDocumentIndex)
  }, [queryClient])

  const openDocuments = useCallback(async () => {
    const { startOperation, finishOperation } = useOperationStore.getState()
    startOperation({
      type: 'load-khr',
      cancellable: false,
    })
    try {
      const count = await api.openDocuments()
      useEditorUiStore.getState().setTotalPages(count)
      queryClient.setQueryData(queryKeys.documents.count, count)
      await refreshDocuments()
      if (count > 0) {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.documents.current(0),
          queryFn: () => api.getDocument(0),
        })
      }
    } finally {
      finishOperation()
    }
  }, [queryClient, refreshDocuments])

  const addDocuments = useCallback(async () => {
    const { startOperation, finishOperation } = useOperationStore.getState()
    startOperation({
      type: 'load-khr',
      cancellable: false,
    })
    try {
      const editorUi = useEditorUiStore.getState()
      const previousCount = editorUi.totalPages
      const count = await api.addDocuments()
      if (count === previousCount) {
        return
      }

      queryClient.setQueryData(queryKeys.documents.count, count)
      await refreshDocuments()
      useEditorUiStore.setState((state) => ({
        totalPages: count,
        documentsVersion: state.documentsVersion + 1,
        currentDocumentIndex: previousCount > 0 ? previousCount : 0,
        selectedBlockIndex: undefined,
      }))

      if (count > previousCount) {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.documents.current(previousCount),
          queryFn: () => api.getDocument(previousCount),
        })
      }
    } finally {
      finishOperation()
    }
  }, [queryClient, refreshDocuments])

  const openFolder = useCallback(async () => {
    const { startOperation, finishOperation } = useOperationStore.getState()
    startOperation({
      type: 'load-khr',
      cancellable: false,
    })
    try {
      const count = await api.openFolder()
      useEditorUiStore.getState().setTotalPages(count)
      queryClient.setQueryData(queryKeys.documents.count, count)
      await refreshDocuments()
      if (count > 0) {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.documents.current(0),
          queryFn: () => api.getDocument(0),
        })
      }
    } finally {
      finishOperation()
    }
  }, [queryClient, refreshDocuments])

  const addFolder = useCallback(async () => {
    const { startOperation, finishOperation } = useOperationStore.getState()
    startOperation({
      type: 'load-khr',
      cancellable: false,
    })
    try {
      const editorUi = useEditorUiStore.getState()
      const previousCount = editorUi.totalPages
      const count = await api.addFolder()
      if (count === previousCount) {
        return
      }

      queryClient.setQueryData(queryKeys.documents.count, count)
      await refreshDocuments()
      useEditorUiStore.setState((state) => ({
        totalPages: count,
        documentsVersion: state.documentsVersion + 1,
        currentDocumentIndex: previousCount > 0 ? previousCount : 0,
        selectedBlockIndex: undefined,
      }))

      if (count > previousCount) {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.documents.current(previousCount),
          queryFn: () => api.getDocument(previousCount),
        })
      }
    } finally {
      finishOperation()
    }
  }, [queryClient, refreshDocuments])

  const openExternal = useCallback(async (url: string) => {
    await api.openExternal(url)
  }, [])

  const { startOperation, finishOperation } = useOperationStore.getState()

  const detect = useCallback(
    async (_?: unknown, index?: number) => {
      const resolvedIndex =
        index ?? useEditorUiStore.getState().currentDocumentIndex
      startOperation({
        type: 'process-current',
        step: 'detect',
        cancellable: true,
      })
      try {
        await api.detect(resolvedIndex)
        await invalidateCurrentDocument(queryClient, resolvedIndex)
        await invalidateThumbnailAtIndex(queryClient, resolvedIndex)
      } finally {
        finishOperation()
      }
    },
    [queryClient, startOperation, finishOperation],
  )

  const ocr = useCallback(
    async (_?: unknown, index?: number) => {
      const resolvedIndex =
        index ?? useEditorUiStore.getState().currentDocumentIndex
      startOperation({
        type: 'process-current',
        step: 'ocr',
        cancellable: true,
      })
      try {
        await api.ocr(resolvedIndex)
        await invalidateCurrentDocument(queryClient, resolvedIndex)
        await invalidateThumbnailAtIndex(queryClient, resolvedIndex)
      } finally {
        finishOperation()
      }
    },
    [queryClient, startOperation, finishOperation],
  )

  const processImage = useCallback(
    async (_?: unknown, index?: number) => {
      const resolvedIndex =
        index ?? useEditorUiStore.getState().currentDocumentIndex
      const { startOperation, finishOperation } = useOperationStore.getState()
      startOperation({
        type: 'process-current',
        cancellable: true,
        current: 0,
        total: 2,
      })
      try {
        await api.process({
          index: resolvedIndex,
        })
      } catch (error) {
        logger.error('Failed to start processing', error)
        toast('Failed to process image', 'error')
        finishOperation()
        await clearProgress()
      }
    },
    [clearProgress, toast],
  )

  const processAllImages = useCallback(async () => {
    const { totalPages } = useEditorUiStore.getState()
    const { startOperation, finishOperation } = useOperationStore.getState()
    if (!totalPages) return
    startOperation({
      type: 'process-all',
      cancellable: true,
      current: 0,
      total: totalPages,
    })
    try {
      await api.process({})
    } catch (error) {
      logger.error('Failed to start processing', error)
      toast('Failed to process all images', 'error')
      finishOperation()
      await clearProgress()
    }
  }, [clearProgress, toast])

  const exportDocument = useCallback(async () => {
    const { currentDocumentIndex } = useEditorUiStore.getState()
    await api.exportDocument(currentDocumentIndex)
  }, [])

  const exportAllDocuments = useCallback(async () => {
    await api.exportAllDocuments()
  }, [])

  const cancelOperation = useCallback(async () => {
    useOperationStore.getState().cancelOperation()
    await api.processCancel().catch(() => {})
  }, [])

  return {
    refreshCurrentDocument,
    addDocuments,
    openDocuments,
    openFolder,
    addFolder,
    openExternal,
    detect,
    ocr,
    processImage,
    processAllImages,
    exportDocument,
    exportAllDocuments,
    cancelOperation,
    setProgress,
    clearProgress,
  }
}
