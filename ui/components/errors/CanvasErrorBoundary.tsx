'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CanvasErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface CanvasErrorBoundaryProps {
  children: React.ReactNode
}

export class CanvasErrorBoundary extends React.Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  constructor(props: CanvasErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Canvas Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <CanvasErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

function CanvasErrorFallback({ error }: { error?: Error }) {
  const { t } = useTranslation()

  return (
    <div className='flex h-full flex-col items-center justify-center p-4'>
      <AlertCircleIcon className='text-destructive mx-auto mb-3 size-12' />
      <h3 className='text-foreground mb-2 text-lg font-semibold'>
        {t('errors.canvasError')}
      </h3>
      <p className='text-muted-foreground mb-4 text-sm max-w-md'>
        {error?.message || t('errors.unknownError')}
      </p>
      <Button
        variant='outline'
        size='sm'
        onClick={() => window.location.reload()}
        className='gap-2'
      >
        <RefreshCwIcon className='size-4' />
        {t('errors.reload')}
      </Button>
    </div>
  )
}
