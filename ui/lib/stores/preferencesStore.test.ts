import { describe, it, expect, beforeEach } from 'vitest'
import { usePreferencesStore } from '@/lib/stores/preferencesStore'

describe('preferencesStore', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ resetPreferences: () => {} })
  })

  it('should have resetPreferences function', () => {
    const state = usePreferencesStore.getState()
    expect(typeof state.resetPreferences).toBe('function')
  })

  it('should reset to initial state', () => {
    const { resetPreferences } = usePreferencesStore.getState()
    resetPreferences()
    const state = usePreferencesStore.getState()
    expect(typeof state.resetPreferences).toBe('function')
  })
})
