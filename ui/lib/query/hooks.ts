'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query/keys'
import { useEditorUiStore } from '@/lib/stores/editorUiStore'
import { loadTextBlocksFromStorage } from '@/lib/services/localStorage'
import type { Document, TextBlock } from '@/types'

const fetchDocumentWithStorage = async (index: number): Promise<Document> => {
  const doc = await api.getDocument(index)
  const storedTextBlocks = loadTextBlocksFromStorage(index)
  const textBlocks: TextBlock[] = storedTextBlocks && storedTextBlocks.length > 0
    ? (storedTextBlocks as TextBlock[])
    : (doc.textBlocks as TextBlock[])

  return {
    id: doc.id,
    path: doc.path,
    name: doc.name,
    image: doc.image,
    width: doc.width,
    height: doc.height,
    revision: doc.revision,
    textBlocks,
    segment: doc.segment,
  }
}

export const useDocumentsCountQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.documents.count,
    queryFn: () => api.getDocumentsCount(),
    enabled,
  })

export const useCurrentDocumentQuery = (index: number, enabled = true) =>
  useQuery({
    queryKey: queryKeys.documents.current(index),
    queryFn: () => fetchDocumentWithStorage(index),
    enabled,
    placeholderData: keepPreviousData,
    structuralSharing: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

export const useCurrentDocumentState = () => {
  const currentDocumentIndex = useEditorUiStore(
    (state) => state.currentDocumentIndex,
  )
  const { data: totalPages = 0 } = useDocumentsCountQuery()
  const currentDocumentQuery = useCurrentDocumentQuery(
    currentDocumentIndex,
    totalPages > 0,
  )

  return {
    currentDocumentIndex,
    totalPages,
    currentDocument: currentDocumentQuery.data ?? null,
    currentDocumentLoading: currentDocumentQuery.isPending,
    refreshCurrentDocument: currentDocumentQuery.refetch,
  }
}

export const THUMBNAIL_STALE_MS = 10 * 60 * 1000

export const useThumbnailQuery = (index: number, documentsVersion: number) =>
  useQuery({
    queryKey: queryKeys.documents.thumbnail(documentsVersion, index),
    queryFn: () => api.getThumbnail(index),
    structuralSharing: false,
    staleTime: THUMBNAIL_STALE_MS,
    refetchOnWindowFocus: false,
  })

export const useFontsQuery = () =>
  useQuery({
    queryKey: queryKeys.fonts,
    queryFn: () => api.listFonts(),
    staleTime: 10 * 60 * 1000,
  })

export const useDeviceInfoQuery = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.device.info,
    queryFn: () => api.deviceInfo(),
    enabled,
    staleTime: 10 * 60 * 1000,
  })

export const useAppVersionQuery = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.app.version,
    queryFn: () => api.appVersion(),
    enabled,
    staleTime: 10 * 60 * 1000,
  })
