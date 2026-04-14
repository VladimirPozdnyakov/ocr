'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavigatorErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface NavigatorErrorBoundaryProps {
  children: React.ReactNode
}

export class NavigatorErrorBoundary extends React.Component<
  NavigatorErrorBoundaryProps,
  NavigatorErrorBoundaryState
> {
  constructor(props: NavigatorErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): NavigatorErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Navigator Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <NavigatorErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

function NavigatorErrorFallback({ error }: { error?: Error }) {
  const { t } = useTranslation()

  return (
    <div className='flex h-full items-center justify-center p-4'>
      <div className='text-center'>
        <AlertCircleIcon className='text-destructive mx-auto mb-3 size-8' />
        <h3 className='text-foreground mb-2 text-sm font-semibold'>
          {t('errors.navigatorError')}
        </h3>
        <p className='text-muted-foreground mb-4 text-xs'>
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
