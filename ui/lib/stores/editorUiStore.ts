'use client'

import { create } from 'zustand'
import { ToolMode } from '@/types'

type EditorUiState = {
  totalPages: number
  documentsVersion: number
  currentDocumentIndex: number
  scale: number
  showSegmentationMask: boolean
  showTextBlocksOverlay: boolean
  mode: ToolMode
  selectedBlockIndex?: number
  autoFitEnabled: boolean
  pendingDeleteIndex?: number
  setTotalPages: (count: number) => void
  setCurrentDocumentIndex: (index: number) => void
  setScale: (scale: number) => void
  setShowSegmentationMask: (show: boolean) => void
  setShowTextBlocksOverlay: (show: boolean) => void
  setMode: (mode: ToolMode) => void
  setSelectedBlockIndex: (index?: number) => void
  setAutoFitEnabled: (enabled: boolean) => void
  requestDeleteBlock: (index: number) => void
  confirmDeleteBlock: () => number | undefined
  cancelDeleteBlock: () => void
  resetUiState: () => void
}

const initialState = {
  totalPages: 0,
  documentsVersion: 0,
  currentDocumentIndex: 0,
  scale: 100,
  showSegmentationMask: true,
  showTextBlocksOverlay: true,
  mode: 'block' as ToolMode,
  selectedBlockIndex: undefined,
  autoFitEnabled: true,
}

export const useEditorUiStore = create<EditorUiState>((set, get) => ({
  ...initialState,
  setTotalPages: (count) => {
    set((state) => {
      if (state.totalPages === count) return state
      return {
        totalPages: count,
        documentsVersion: state.documentsVersion + 1,
        currentDocumentIndex: 0,
        selectedBlockIndex: undefined,
      }
    })
  },
  setCurrentDocumentIndex: (index) =>
    set(() => ({
      currentDocumentIndex: index,
      selectedBlockIndex: undefined,
    })),
  setScale: (scale) => {
    const clamped = Math.max(10, Math.min(300, Math.round(scale)))
    set({ scale: clamped })
  },
  setShowSegmentationMask: (show) => set({ showSegmentationMask: show }),
  setShowTextBlocksOverlay: (show) => set({ showTextBlocksOverlay: show }),
  setMode: (mode) => {
    const updates: Partial<EditorUiState> = { mode }

    if (mode === 'block') {
      Object.assign(updates, {
        showTextBlocksOverlay: true,
        showSegmentationMask: true,
      })
    }

    set(updates)
  },
  setSelectedBlockIndex: (index) => set({ selectedBlockIndex: index }),
  setAutoFitEnabled: (enabled) => set({ autoFitEnabled: enabled }),
  requestDeleteBlock: (index) => set({ pendingDeleteIndex: index }),
  confirmDeleteBlock: () => {
    const index = get().pendingDeleteIndex
    set({ pendingDeleteIndex: undefined })
    return index
  },
  cancelDeleteBlock: () => set({ pendingDeleteIndex: undefined }),
  resetUiState: () =>
    set(() => ({
      ...initialState,
      totalPages: get().totalPages,
      documentsVersion: get().documentsVersion,
      currentDocumentIndex: get().currentDocumentIndex,
    })),
}))
