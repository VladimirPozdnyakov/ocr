import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOperationStore } from './operationStore'

describe('useOperationStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { resetOperationState } = useOperationStore.getState()
    resetOperationState()
  })

  it('should have initial state with no operation', () => {
    const { result } = renderHook(() => useOperationStore())

    expect(result.current.operation).toBeUndefined()
  })

  it('should start operation', () => {
    const { result } = renderHook(() => useOperationStore())

    act(() => {
      result.current.startOperation({
        type: 'load-khr',
        cancellable: false,
      })
    })

    expect(result.current.operation).toEqual({
      type: 'load-khr',
      cancellable: false,
      cancelRequested: false,
    })
  })

  it('should finish operation', () => {
    const { result } = renderHook(() => useOperationStore())

    act(() => {
      result.current.startOperation({
        type: 'process-current',
        cancellable: true,
        step: 'detect',
      })
    })

    expect(result.current.operation).toBeDefined()

    act(() => {
      result.current.finishOperation()
    })

    expect(result.current.operation).toBeUndefined()
  })

  it('should cancel operation', () => {
    const { result } = renderHook(() => useOperationStore())

    act(() => {
      result.current.startOperation({
        type: 'process-current',
        cancellable: true,
        step: 'ocr',
      })
    })

    expect(result.current.operation).toBeDefined()
    expect(result.current.operation?.cancelRequested).toBe(false)

    act(() => {
      result.current.cancelOperation()
    })

    expect(result.current.operation?.cancelRequested).toBe(true)
  })

  it('should update operation progress', () => {
    const { result } = renderHook(() => useOperationStore())

    act(() => {
      result.current.startOperation({
        type: 'process-all',
        cancellable: true,
        current: 0,
        total: 10,
      })
    })

    expect(result.current.operation?.current).toBe(0)
    expect(result.current.operation?.total).toBe(10)

    act(() => {
      result.current.updateOperation({ current: 5 })
    })

    expect(result.current.operation?.current).toBe(5)
    expect(result.current.operation?.total).toBe(10)
  })

  it('should update operation step', () => {
    const { result } = renderHook(() => useOperationStore())

    act(() => {
      result.current.startOperation({
        type: 'process-current',
        cancellable: true,
        step: 'detect',
      })
    })

    expect(result.current.operation?.step).toBe('detect')

    act(() => {
      result.current.updateOperation({ step: 'ocr' })
    })

    expect(result.current.operation?.step).toBe('ocr')
  })

  it('should handle operation with all properties', () => {
    const { result } = renderHook(() => useOperationStore())

    act(() => {
      result.current.startOperation({
        type: 'process-all',
        cancellable: true,
        current: 2,
        total: 5,
        step: 'ocr',
      })
    })

    expect(result.current.operation).toEqual({
      type: 'process-all',
      cancellable: true,
      current: 2,
      total: 5,
      step: 'ocr',
      cancelRequested: false,
    })
  })
})
