'use client'

import { useCurrentDocumentState } from '@/lib/query/hooks'
import { useTextBlockMutations } from '@/lib/query/mutations'
import { createTempTextBlockId, api } from '@/lib/api'
import { useEditorUiStore } from '@/lib/stores/editorUiStore'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import { TextBlock } from '@/types'

const hasGeometryChange = (updates: Partial<TextBlock>) =>
  Object.prototype.hasOwnProperty.call(updates, 'x') ||
  Object.prototype.hasOwnProperty.call(updates, 'y') ||
  Object.prototype.hasOwnProperty.call(updates, 'width') ||
  Object.prototype.hasOwnProperty.call(updates, 'height')

export function useTextBlocks() {
  const { currentDocument: document, currentDocumentIndex } =
    useCurrentDocumentState()
  const textBlocks = document?.textBlocks ?? []
  const selectedBlockIndex = useEditorUiStore(
    (state) => state.selectedBlockIndex,
  )
  const setSelectedBlockIndex = useEditorUiStore(
    (state) => state.setSelectedBlockIndex,
  )
  const pendingDeleteIndex = useEditorUiStore(
    (state) => state.pendingDeleteIndex,
  )
  const { updateTextBlocks } = useTextBlockMutations()
  const queryClient = useQueryClient()

  const replaceBlock = async (index: number, updates: Partial<TextBlock>) => {
    const currentBlocks = document?.textBlocks ?? []
    const nextBlocks = currentBlocks.map((block, idx) =>
      idx === index ? { ...block, ...updates } : block,
    )
    await updateTextBlocks(nextBlocks)

    if (hasGeometryChange(updates)) {
      const ui = useEditorUiStore.getState()
      ui.setShowTextBlocksOverlay(true)
    }
  }

  const appendBlock = async (block: TextBlock) => {
    const currentBlocks = document?.textBlocks ?? []
    const nextBlocks = [
      ...currentBlocks,
      {
        ...block,
        id: block.id ?? createTempTextBlockId(),
      },
    ]
    await updateTextBlocks(nextBlocks)
    setSelectedBlockIndex(nextBlocks.length - 1)
  }

  const removeBlock = async (index: number) => {
    const currentBlocks = document?.textBlocks ?? []
    const nextBlocks = currentBlocks.filter((_, idx) => idx !== index)
    await updateTextBlocks(nextBlocks)
    setSelectedBlockIndex(undefined)
  }

  const moveBlock = async (fromIndex: number, toIndex: number) => {
    const currentBlocks = document?.textBlocks ?? []
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || fromIndex >= currentBlocks.length) return
    if (toIndex < 0 || toIndex >= currentBlocks.length) return

    const nextBlocks = [...currentBlocks]
    const [movedBlock] = nextBlocks.splice(fromIndex, 1)
    nextBlocks.splice(toIndex, 0, movedBlock)
    await updateTextBlocks(nextBlocks)
    setSelectedBlockIndex(toIndex)
  }

  const rescanTextBlock = async (index: number) => {
    const block = textBlocks[index]
    if (!block?.id || !document) return
    await api.ocrTextBlock(currentDocumentIndex, block.id)
    await queryClient.invalidateQueries({
      queryKey: queryKeys.documents.current(currentDocumentIndex),
    })
  }

  const clearSelection = () => {
    setSelectedBlockIndex(undefined)
  }

  const requestDelete = (index: number) =>
    useEditorUiStore.getState().requestDeleteBlock(index)
  const confirmDelete = () => {
    const index = useEditorUiStore.getState().confirmDeleteBlock()
    if (index !== undefined) void removeBlock(index)
  }
  const cancelDelete = () => useEditorUiStore.getState().cancelDeleteBlock()

  return {
    document,
    textBlocks,
    selectedBlockIndex,
    setSelectedBlockIndex,
    clearSelection,
    replaceBlock,
    appendBlock,
    removeBlock,
    moveBlock,
    rescanTextBlock,
    pendingDeleteIndex,
    requestDelete,
    confirmDelete,
    cancelDelete,
  }
}
