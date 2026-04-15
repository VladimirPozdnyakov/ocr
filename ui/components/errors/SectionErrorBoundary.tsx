'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SectionErrorBoundaryProps {
  children: React.ReactNode
  errorTitleKey: string
  size?: 'lg' | 'sm'
}

interface SectionErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class SectionErrorBoundary extends React.Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Section error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <SectionErrorFallback
          error={this.state.error}
          errorTitleKey={this.props.errorTitleKey}
          size={this.props.size ?? 'sm'}
        />
      )
    }

    return this.props.children
  }
}

function SectionErrorFallback({
  error,
  errorTitleKey,
  size,
}: {
  error?: Error
  errorTitleKey: string
  size: 'lg' | 'sm'
}) {
  const { t } = useTranslation()

  const isLarge = size === 'lg'
  const iconSize = isLarge ? 'size-12' : 'size-8'
  const titleSize = isLarge ? 'text-lg' : 'text-sm'
  const messageSize = isLarge ? 'text-sm max-w-md' : 'text-xs'

  return (
    <div className='flex h-full items-center justify-center p-4'>
      <div className={isLarge ? '' : 'text-center'}>
        <AlertCircleIcon
          className={`text-destructive mx-auto mb-3 ${iconSize}`}
        />
        <h3 className={`text-foreground mb-2 font-semibold ${titleSize}`}>
          {t(errorTitleKey)}
        </h3>
        <p className={`text-muted-foreground mb-4 ${messageSize}`}>
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
    </div>
  )
}
