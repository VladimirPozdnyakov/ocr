'use client'

export type OperationType = 'load-khr' | 'process-current' | 'process-all'

export type OperationState = {
  type: OperationType
  step?: string
  current?: number
  total?: number
  cancellable: boolean
  cancelRequested: boolean
}

export type OperationSlice = {
  operation?: OperationState
  startOperation: (operation: Omit<OperationState, 'cancelRequested'>) => void
  updateOperation: (operation: Partial<OperationState>) => void
  finishOperation: () => void
  cancelOperation: () => void
}

type SetState<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean | undefined,
) => void

// Simple factory to attach operation helpers to a Zustand store.
export const createOperationSlice = (
  set: SetState<OperationSlice>,
): OperationSlice => ({
  operation: undefined,
  startOperation: (operation) =>
    set({
      operation: {
        ...operation,
        cancelRequested: false,
      },
    }),
  updateOperation: (operation) =>
    set((state: OperationSlice) =>
      state.operation
        ? { operation: { ...state.operation, ...operation } }
        : { operation: undefined },
    ),
  finishOperation: () => set({ operation: undefined }),
  cancelOperation: () => {
    set((state: OperationSlice) =>
      state.operation
        ? { operation: { ...state.operation, cancelRequested: true } }
        : { operation: undefined },
    )
    // Also cancel backend pipeline if running
    import('@/lib/api').then(({ api }) => {
      api.processCancel().catch(() => {})
    })
  },
})
