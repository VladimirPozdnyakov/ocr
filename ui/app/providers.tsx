'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { ThemeProvider } from 'next-themes'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  getCurrentWindow,
  subscribeDocumentChanged,
  subscribeDocumentsChanged,
  subscribeJobChanged,
  subscribeSnapshot,
} from '@/lib/backend'
import i18n from '@/lib/i18n'
import { getQueryClient } from '@/lib/query/client'
import { queryKeys } from '@/lib/query/keys'
import { useDocumentsCountQuery } from '@/lib/query/hooks'
import { useDownloadStore } from '@/lib/downloads'
import { useEditorUiStore } from '@/lib/stores/editorUiStore'
import { useOperationStore } from '@/lib/stores/operationStore'
import { useRpcConnection } from '@/hooks/useRpcConnection'
import type { DocumentSummary, JobState, SnapshotEvent } from '@/lib/protocol'

const invalidateDocumentQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.documents.currentRoot })
  queryClient.invalidateQueries({ queryKey: queryKeys.documents.thumbnailRoot })
}

function ProvidersBootstrap({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const hasConnectedRef = useRef(false)
  const setTotalPages = useEditorUiStore((state) => state.setTotalPages)
  const rpcConnected = useRpcConnection()
  const { data: documentsCount } = useDocumentsCountQuery(rpcConnected)

  const applyDocumentsSnapshot = (documents: DocumentSummary[]) => {
    const count = documents.length
    useEditorUiStore.setState((state) => ({
      totalPages: count,
      currentDocumentIndex:
        count === 0 ? 0 : Math.min(state.currentDocumentIndex, count - 1),
      selectedBlockIndex: count === 0 ? undefined : state.selectedBlockIndex,
      documentsVersion: state.documentsVersion + 1,
    }))
    queryClient.setQueryData(queryKeys.documents.count, count)
    invalidateDocumentQueries(queryClient)
  }

  const updatePipelineUi = (job: JobState | null) => {
    const operationStore = useOperationStore.getState()

    if (!job) {
      return
    }

    if (job.status === 'running') {
      const isSingleDoc = job.totalDocuments <= 1
      operationStore.updateOperation({
        step: job.step ?? undefined,
        current: isSingleDoc
          ? job.currentStepIndex
          : job.currentDocument +
            (job.totalSteps > 0 ? job.currentStepIndex / job.totalSteps : 0),
        total: isSingleDoc ? job.totalSteps : job.totalDocuments,
      })

      getCurrentWindow()
        .setProgressBar({
          progress: job.overallPercent,
        })
        .catch(() => {})
      return
    }

    operationStore.updateOperation({
      current: operationStore.operation?.total,
      total: operationStore.operation?.total,
    })

    getCurrentWindow()
      .setProgressBar({ progress: 100 })
      .catch(() => {})

    invalidateDocumentQueries(queryClient)

    setTimeout(() => {
      useOperationStore.getState().finishOperation()
      getCurrentWindow()
        .setProgressBar({
          progress: 0,
        })
        .catch(() => {})
    }, 1000)
  }

  useEffect(() => {
    if (!rpcConnected) return

    if (hasConnectedRef.current) {
      queryClient.invalidateQueries({ type: 'active' })
      return
    }

    hasConnectedRef.current = true
  }, [queryClient, rpcConnected])

  useEffect(() => {
    if (typeof documentsCount === 'number') {
      setTotalPages(documentsCount)
    }
  }, [documentsCount, setTotalPages])

  useEffect(() => {
    const unsubscribeSnapshot = subscribeSnapshot((payload: SnapshotEvent) => {
      applyDocumentsSnapshot(payload.documents)
      const pipelineJob =
        payload.jobs.find((job) => job.kind === 'pipeline') ?? null
      updatePipelineUi(pipelineJob)
    })

    const unsubscribeDocuments = subscribeDocumentsChanged((payload) => {
      applyDocumentsSnapshot(payload.documents)
    })

    const unsubscribeDocument = subscribeDocumentChanged(() => {
      invalidateDocumentQueries(queryClient)
    })

    const unsubscribeJobs = subscribeJobChanged((job) => {
      if (job.kind !== 'pipeline') return
      updatePipelineUi(job)
      invalidateDocumentQueries(queryClient)
    })

    return () => {
      unsubscribeSnapshot()
      unsubscribeDocuments()
      unsubscribeDocument()
      unsubscribeJobs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, setTotalPages])

  return children
}

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const queryClient = getQueryClient()
  const ensureDownloadSubscribed = useDownloadStore(
    (state) => state.ensureSubscribed,
  )

  useEffect(() => {
    ensureDownloadSubscribed()
  }, [ensureDownloadSubscribed])

  useEffect(() => {
    setMounted(true)

    const handleLanguageChange = (lng: string) => {
      document.documentElement.lang = lng
    }

    handleLanguageChange(i18n.language)
    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [])

  if (!mounted) return null

  return (
    <QueryClientProvider client={queryClient}>
      <ProvidersBootstrap>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
          </ThemeProvider>
        </I18nextProvider>
      </ProvidersBootstrap>
    </QueryClientProvider>
  )
}

export default Providers
