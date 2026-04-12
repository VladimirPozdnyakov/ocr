'use client'

import { useTranslation } from 'react-i18next'
import { ScanIcon, ScanTextIcon, LoaderCircleIcon } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useDocumentMutations } from '@/lib/query/mutations'
import { useOperationStore } from '@/lib/stores/operationStore'

export function CanvasToolbar() {
  return (
    <div className='luxury-border-subtle border-b bg-card/80 text-foreground flex items-center gap-4 px-5 py-3 text-xs '>
      <WorkflowButtons />
      <div className='flex-1' />
    </div>
  )
}

function WorkflowButtons() {
  const { detect, ocr } = useDocumentMutations()
  const { t } = useTranslation()
  const operation = useOperationStore((state) => state.operation)

  const isDetecting =
    operation?.type === 'process-current' && operation?.step === 'detect'
  const isOcr =
    operation?.type === 'process-current' && operation?.step === 'ocr'

  return (
    <div className='flex items-center gap-1'>
      <Button
        variant='ghost'
        size='xs'
        onClick={detect}
        data-testid='toolbar-detect'
        disabled={isDetecting}
        className='luxury-border-subtle luxury-shadow hover:bg-luxury-gold hover:text-background data-[disabled]:opacity-50 rounded-sm px-4 py-2 font-inter font-medium tracking-wide transition-all duration-200'
      >
        {isDetecting ? (
          <LoaderCircleIcon className='size-4 luxury-fade-in text-luxury-gold' />
        ) : (
          <ScanIcon className='size-4' />
        )}
        <span className='ml-1'>{t('processing.detect')}</span>
      </Button>

      <Separator orientation='vertical' className='luxury-border-subtle mx-2 h-6 border-l' />

      <Button
        variant='ghost'
        size='xs'
        onClick={ocr}
        data-testid='toolbar-ocr'
        disabled={isOcr}
        className='luxury-border-subtle luxury-shadow hover:bg-luxury-gold hover:text-background data-[disabled]:opacity-50 rounded-sm px-4 py-2 font-inter font-medium tracking-wide transition-all duration-200'
      >
        {isOcr ? (
          <LoaderCircleIcon className='size-4 luxury-fade-in text-luxury-gold' />
        ) : (
          <ScanTextIcon className='size-4' />
        )}
        <span className='ml-1'>{t('processing.ocr')}</span>
      </Button>
    </div>
  )
}
