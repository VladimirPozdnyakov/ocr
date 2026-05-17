'use client'

import { useTranslation } from 'react-i18next'
import {
  ScanIcon,
  ScanTextIcon,
  LoaderCircleIcon,
  MousePointer2Icon,
  HandIcon,
  ZoomInIcon,
  ZoomOutIcon,
  Maximize2Icon,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useDocumentMutations } from '@/lib/query/mutations'
import { useOperationStore } from '@/lib/stores/operationStore'
import { useEditorUiStore } from '@/lib/stores/editorUiStore'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function CanvasToolbar() {
  const scale = useEditorUiStore((state) => state.scale)
  const autoFitEnabled = useEditorUiStore((state) => state.autoFitEnabled)

  return (
    <div className='luxury-border-subtle border-b bg-card/80 text-foreground flex items-center gap-2 px-4 py-2 text-xs'>
      <ToolSelectionGroup />
      <Separator orientation='vertical' className='luxury-border-subtle mx-1 h-6 border-l' />
      <WorkflowButtons />
      <div className='flex-1' />
      <ZoomControls scale={scale} autoFitEnabled={autoFitEnabled} />
    </div>
  )
}

function ToolSelectionGroup() {
  const { t } = useTranslation()
  const mode = useEditorUiStore((state) => state.mode)
  const setMode = useEditorUiStore((state) => state.setMode)

  return (
    <div className='flex items-center gap-0.5'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='xs'
            onClick={() => setMode('select')}
            className={`luxury-border-subtle min-h-[36px] cursor-pointer rounded-sm px-3 font-medium transition-all ${
              mode === 'select'
                ? 'bg-luxury-gold text-background luxury-shadow'
                : 'hover:bg-luxury-gold/10 hover:text-foreground'
            }`}
          >
            <MousePointer2Icon className='size-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>{t('toolRail.select')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='xs'
            onClick={() => setMode('pan')}
            className={`luxury-border-subtle min-h-[36px] cursor-pointer rounded-sm px-3 font-medium transition-all ${
              mode === 'pan'
                ? 'bg-luxury-gold text-background luxury-shadow'
                : 'hover:bg-luxury-gold/10 hover:text-foreground'
            }`}
          >
            <HandIcon className='size-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>{t('shortcuts.pan')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='xs'
            onClick={() => setMode('block')}
            className={`luxury-border-subtle min-h-[36px] cursor-pointer rounded-sm px-3 font-medium transition-all ${
              mode === 'block'
                ? 'bg-luxury-gold text-background luxury-shadow'
                : 'hover:bg-luxury-gold/10 hover:text-foreground'
            }`}
          >
            <ScanIcon className='size-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>{t('toolRail.block')}</TooltipContent>
      </Tooltip>
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
        className='luxury-border-subtle luxury-shadow hover:bg-luxury-gold hover:text-background active:bg-luxury-gold/90 active:scale-95 data-[disabled]:opacity-50 min-h-[36px] cursor-pointer rounded-sm px-3 py-1.5 font-medium tracking-wide transition-all duration-150'
      >
        {isDetecting ? (
          <LoaderCircleIcon className='size-4 luxury-fade-in text-luxury-gold' aria-label={t('aria.detecting')} />
        ) : (
          <ScanIcon className='size-4' aria-label={t('aria.detectTextBlocks')} />
        )}
        <span className='ml-1.5'>{t('processing.detect')}</span>
      </Button>

      <Separator orientation='vertical' className='luxury-border-subtle mx-1 h-6 border-l' />

      <Button
        variant='ghost'
        size='xs'
        onClick={ocr}
        data-testid='toolbar-ocr'
        disabled={isOcr}
        className='luxury-border-subtle luxury-shadow hover:bg-luxury-gold hover:text-background active:bg-luxury-gold/90 active:scale-95 data-[disabled]:opacity-50 min-h-[36px] cursor-pointer rounded-sm px-3 py-1.5 font-medium tracking-wide transition-all duration-150'
      >
        {isOcr ? (
          <LoaderCircleIcon className='size-4 luxury-fade-in text-luxury-gold' aria-label={t('statusBar.ocr') + '...'} />
        ) : (
          <ScanTextIcon className='size-4' aria-label={t('aria.recognizeText')} />
        )}
        <span className='ml-1.5'>{t('processing.ocr')}</span>
      </Button>
    </div>
  )
}

function ZoomControls({
  scale,
  autoFitEnabled,
}: {
  scale: number
  autoFitEnabled: boolean
}) {
  const { t } = useTranslation()
  const setScale = useEditorUiStore((state) => state.setScale)
  const setAutoFitEnabled = useEditorUiStore((state) => state.setAutoFitEnabled)

  const handleZoomIn = () => {
    setAutoFitEnabled(false)
    setScale(scale + 25)
  }

  const handleZoomOut = () => {
    setAutoFitEnabled(false)
    setScale(scale - 25)
  }

  const handleFitWindow = () => {
    setAutoFitEnabled(true)
  }

  return (
    <div className='flex items-center gap-1'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon-xs'
            onClick={handleZoomOut}
            disabled={scale <= 25}
            className='luxury-border-subtle hover:bg-luxury-gold/10 min-h-[28px] w-7 cursor-pointer rounded-sm transition-all'
          >
            <ZoomOutIcon className='size-3.5' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>{t('shortcuts.zoomOut')}</TooltipContent>
      </Tooltip>

      <button
        onClick={handleFitWindow}
        className={`luxury-border-subtle min-w-[60px] rounded-sm px-2 py-1 text-center font-mono text-[10px] font-medium transition-all ${
          autoFitEnabled
            ? 'bg-luxury-gold/20 text-luxury-gold'
            : 'hover:bg-luxury-gold/10 text-muted-foreground'
        }`}
        title={autoFitEnabled ? 'Auto-fit enabled' : `${scale}%`}
      >
        {autoFitEnabled ? 'Fit' : `${scale}%`}
      </button>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon-xs'
            onClick={handleZoomIn}
            disabled={scale >= 300}
            className='luxury-border-subtle hover:bg-luxury-gold/10 min-h-[28px] w-7 cursor-pointer rounded-sm transition-all'
          >
            <ZoomInIcon className='size-3.5' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>{t('shortcuts.zoomIn')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon-xs'
            onClick={handleFitWindow}
            className='luxury-border-subtle hover:bg-luxury-gold/10 min-h-[28px] w-7 cursor-pointer rounded-sm transition-all'
          >
            <Maximize2Icon className='size-3.5' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>{t('menu.fitWindow')}</TooltipContent>
      </Tooltip>
    </div>
  )
}