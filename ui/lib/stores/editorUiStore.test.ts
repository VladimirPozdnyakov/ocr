import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEditorUiStore } from './editorUiStore'

describe('useEditorUiStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { resetUiState } = useEditorUiStore.getState()
    resetUiState()
  })

  it('should have initial state', () => {
    const { result } = renderHook(() => useEditorUiStore())

    expect(result.current.totalPages).toBe(0)
    expect(result.current.documentsVersion).toBe(0)
    expect(result.current.currentDocumentIndex).toBe(0)
    expect(result.current.scale).toBe(100)
    expect(result.current.showSegmentationMask).toBe(true)
    expect(result.current.showTextBlocksOverlay).toBe(true)
    expect(result.current.mode).toBe('block')
    expect(result.current.selectedBlockIndex).toBeUndefined()
    expect(result.current.autoFitEnabled).toBe(true)
  })

  it('should set total pages', () => {
    const { result } = renderHook(() => useEditorUiStore())

    act(() => {
      result.current.setTotalPages(5)
    })

    expect(result.current.totalPages).toBe(5)
    expect(result.current.documentsVersion).toBe(1)
    expect(result.current.currentDocumentIndex).toBe(0)
    expect(result.current.selectedBlockIndex).toBeUndefined()
  })

  it('should increment documents version when total pages changes', () => {
    const { result } = renderHook(() => useEditorUiStore())

    const initialVersion = result.current.documentsVersion

    act(() => {
      result.current.setTotalPages(3)
    })

    expect(result.current.documentsVersion).toBe(initialVersion + 1)

    act(() => {
      result.current.setTotalPages(4)
    })

    expect(result.current.documentsVersion).toBe(initialVersion + 2)
  })

  it('should set current document index', () => {
    const { result } = renderHook(() => useEditorUiStore())

    act(() => {
      result.current.setCurrentDocumentIndex(2)
    })

    expect(result.current.currentDocumentIndex).toBe(2)
    expect(result.current.selectedBlockIndex).toBeUndefined()
  })

  it('should set scale and clamp between 10 and 300', () => {
    const { result } = renderHook(() => useEditorUiStore())

    act(() => {
      result.current.setScale(150)
    })

    expect(result.current.scale).toBe(150)

    act(() => {
      result.current.setScale(5) // Below minimum
    })

    expect(result.current.scale).toBe(10)

    act(() => {
      result.current.setScale(500) // Above maximum
    })

    expect(result.current.scale).toBe(300)
  })

  it('should round scale values', () => {
    const { result } = renderHook(() => useEditorUiStore())

    act(() => {
      result.current.setScale(123.6)
    })

    expect(result.current.scale).toBe(124)
  })

  it('should toggle segmentation mask', () => {
    const { result } = renderHook(() => useEditorUiStore())

    expect(result.current.showSegmentationMask).toBe(true)

    act(() => {
      result.current.setShowSegmentationMask(false)
    })

    expect(result.current.showSegmentationMask).toBe(false)
  })

  it('should toggle text blocks overlay', () => {
    const { result } = renderHook(() => useEditorUiStore())

    expect(result.current.showTextBlocksOverlay).toBe(true)

    act(() => {
      result.current.setShowTextBlocksOverlay(false)
    })

    expect(result.current.showTextBlocksOverlay).toBe(false)
  })

  it('should set mode and enable overlays when switching to block mode', () => {
    const { result } = renderHook(() => useEditorUiStore())

    // First disable overlays
    act(() => {
      result.current.setShowTextBlocksOverlay(false)
      result.current.setShowSegmentationMask(false)
    })

    expect(result.current.showTextBlocksOverlay).toBe(false)
    expect(result.current.showSegmentationMask).toBe(false)

    // Switch to block mode
    act(() => {
      result.current.setMode('block')
    })

    expect(result.current.mode).toBe('block')
    expect(result.current.showTextBlocksOverlay).toBe(true)
    expect(result.current.showSegmentationMask).toBe(true)
  })

  it('should set mode without affecting overlays in non-block modes', () => {
    const { result } = renderHook(() => useEditorUiStore())

    // First disable overlays
    act(() => {
      result.current.setShowTextBlocksOverlay(false)
      result.current.setShowSegmentationMask(false)
    })

    // Switch to select mode
    act(() => {
      result.current.setMode('select')
    })

    expect(result.current.mode).toBe('select')
    expect(result.current.showTextBlocksOverlay).toBe(false)
    expect(result.current.showSegmentationMask).toBe(false)
  })

  it('should set selected block index', () => {
    const { result } = renderHook(() => useEditorUiStore())

    act(() => {
      result.current.setSelectedBlockIndex(3)
    })

    expect(result.current.selectedBlockIndex).toBe(3)
  })

  it('should clear selected block index', () => {
    const { result } = renderHook(() => useEditorUiStore())

    act(() => {
      result.current.setSelectedBlockIndex(3)
    })

    expect(result.current.selectedBlockIndex).toBe(3)

    act(() => {
      result.current.setSelectedBlockIndex(undefined)
    })

    expect(result.current.selectedBlockIndex).toBeUndefined()
  })

  it('should toggle auto fit enabled', () => {
    const { result } = renderHook(() => useEditorUiStore())

    expect(result.current.autoFitEnabled).toBe(true)

    act(() => {
      result.current.setAutoFitEnabled(false)
    })

    expect(result.current.autoFitEnabled).toBe(false)
  })

  it('should reset UI state while preserving total pages and version', () => {
    const { result } = renderHook(() => useEditorUiStore())

    // Set some state
    act(() => {
      result.current.setTotalPages(5)
      result.current.setCurrentDocumentIndex(2)
      result.current.setScale(200)
      result.current.setSelectedBlockIndex(1)
    })

    const expectedVersion = result.current.documentsVersion
    expect(result.current.totalPages).toBe(5)
    expect(result.current.documentsVersion).toBe(expectedVersion)
    expect(result.current.currentDocumentIndex).toBe(2)
    expect(result.current.scale).toBe(200)
    expect(result.current.selectedBlockIndex).toBe(1)

    // Reset
    act(() => {
      result.current.resetUiState()
    })

    // Should preserve these
    expect(result.current.totalPages).toBe(5)
    expect(result.current.documentsVersion).toBe(expectedVersion)
    expect(result.current.currentDocumentIndex).toBe(2)

    // Should reset these
    expect(result.current.scale).toBe(100)
    expect(result.current.selectedBlockIndex).toBeUndefined()
    expect(result.current.showSegmentationMask).toBe(true)
    expect(result.current.showTextBlocksOverlay).toBe(true)
    expect(result.current.mode).toBe('block')
    expect(result.current.autoFitEnabled).toBe(true)
  })
})
