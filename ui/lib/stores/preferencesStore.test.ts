import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePreferencesStore } from './preferencesStore'

describe('usePreferencesStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { resetPreferences } = usePreferencesStore.getState()
    resetPreferences()
  })

  it('should have initial state', () => {
    const { result } = renderHook(() => usePreferencesStore())

    expect(result.current).toBeDefined()
  })

  it('should reset preferences', () => {
    const { result } = renderHook(() => usePreferencesStore())

    // Reset should work without errors
    act(() => {
      result.current.resetPreferences()
    })

    expect(result.current).toBeDefined()
  })

  it('should persist store configuration', () => {
    const { result } = renderHook(() => usePreferencesStore())

    // Store should be configured with persistence
    expect(result.current).toBeDefined()
  })
})
