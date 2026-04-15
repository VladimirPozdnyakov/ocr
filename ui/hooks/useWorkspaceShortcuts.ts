'use client'

import { useCallback } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useDocumentMutations } from '@/lib/query/mutations'
import { useDocumentsCountQuery } from '@/lib/query/hooks'
import { useEditorUiStore } from '@/lib/stores/editorUiStore'
import { useOperationStore } from '@/lib/stores/operationStore'
import { flushTextBlockSync } from '@/lib/services/syncQueues'

export function useWorkspaceShortcuts() {
  const { detect, ocr, processImage, exportDocument } = useDocumentMutations()
  const { data: totalPagesData = 0 } = useDocumentsCountQuery()
  const totalPages = totalPagesData ?? 0
  const operation = useOperationStore((state) => state.operation)
  const scale = useEditorUiStore((state) => state.scale)
  const setScale = useEditorUiStore((state) => state.setScale)
  const setCurrentDocumentIndex = useEditorUiStore(
    (state) => state.setCurrentDocumentIndex,
  )
  const currentDocumentIndex = useEditorUiStore(
    (state) => state.currentDocumentIndex,
  )
  const setMode = useEditorUiStore((state) => state.setMode)

  const isBusy = operation !== undefined

  const navigateToPage = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalPages) return
      void flushTextBlockSync()
        .catch(() => {})
        .finally(() => {
          setCurrentDocumentIndex(index)
        })
    },
    [totalPages, setCurrentDocumentIndex],
  )

  // D — Detect
  useHotkeys(
    'd',
    () => {
      if (isBusy) return
      detect()
    },
    [isBusy, detect],
  )

  // O — OCR
  useHotkeys(
    'o',
    () => {
      if (isBusy) return
      ocr()
    },
    [isBusy, ocr],
  )

  // P — Process (detect + OCR)
  useHotkeys(
    'p',
    () => {
      if (isBusy) return
      processImage()
    },
    [isBusy, processImage],
  )

  // Ctrl+S / Cmd+S — Export
  useHotkeys(
    'mod+s',
    (event) => {
      event.preventDefault()
      exportDocument()
    },
    { enableOnFormTags: false },
    [exportDocument],
  )

  // PageDown — Next page
  useHotkeys(
    'pagedown',
    (event) => {
      event.preventDefault()
      navigateToPage(currentDocumentIndex + 1)
    },
    { enableOnFormTags: false },
    [currentDocumentIndex, navigateToPage],
  )

  // PageUp — Previous page
  useHotkeys(
    'pageup',
    (event) => {
      event.preventDefault()
      navigateToPage(currentDocumentIndex - 1)
    },
    { enableOnFormTags: false },
    [currentDocumentIndex, navigateToPage],
  )

  // Home — First page
  useHotkeys(
    'home',
    (event) => {
      event.preventDefault()
      navigateToPage(0)
    },
    { enableOnFormTags: false },
    [navigateToPage],
  )

  // End — Last page
  useHotkeys(
    'end',
    (event) => {
      event.preventDefault()
      navigateToPage(totalPages - 1)
    },
    { enableOnFormTags: false },
    [totalPages, navigateToPage],
  )

  // V — Select mode
  useHotkeys('v', () => setMode('select'), [setMode])

  // B — Block mode
  useHotkeys('b', () => setMode('block'), [setMode])

  // Ctrl+= / Cmd+= — Zoom in
  useHotkeys(
    'mod+=',
    (event) => {
      event.preventDefault()
      setScale(scale + 10)
    },
    { enableOnFormTags: false },
    [scale, setScale],
  )

  // Ctrl+- / Cmd+- — Zoom out
  useHotkeys(
    'mod+-',
    (event) => {
      event.preventDefault()
      setScale(scale - 10)
    },
    { enableOnFormTags: false },
    [scale, setScale],
  )
}
