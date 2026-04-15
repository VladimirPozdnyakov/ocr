'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) cancelRef.current?.focus()
  }, [open])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    },
    [onCancel],
  )

  if (!open) return null

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='confirm-dialog-title'
      aria-describedby='confirm-dialog-description'
      className='fixed inset-0 z-[200] flex items-center justify-center'
      onPointerDown={onCancel}
      onKeyDown={handleKeyDown}
    >
      <div className='absolute inset-0 bg-black/40' />
      <div
        className='luxury-border luxury-shadow-xl bg-card relative z-10 w-full max-w-sm rounded-sm p-6'
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h2
          id='confirm-dialog-title'
          className='text-foreground font-poppins mb-2 text-sm font-semibold'
        >
          {title}
        </h2>
        <p
          id='confirm-dialog-description'
          className='text-muted-foreground font-inter mb-6 text-xs'
        >
          {description}
        </p>
        <div className='flex justify-end gap-2'>
          <Button
            ref={cancelRef}
            variant='ghost'
            size='sm'
            onClick={onCancel}
            className='font-inter text-xs'
          >
            {t('confirm.cancel')}
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={onConfirm}
            className='text-luxury-rose hover:bg-luxury-rose/10 font-inter text-xs'
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function useConfirmDelete() {
  const [pendingIndex, setPendingIndex] = useState<number | undefined>()

  const requestDelete = useCallback((index: number) => {
    setPendingIndex(index)
  }, [])

  const cancelDelete = useCallback(() => {
    setPendingIndex(undefined)
  }, [])

  return { pendingDeleteIndex: pendingIndex, requestDelete, cancelDelete }
}
