'use client'

import { useTranslation } from 'react-i18next'
import { useCanvasZoom } from '@/hooks/useCanvasZoom'
import { Slider } from '@/components/ui/slider'
import { LoaderCircleIcon } from 'lucide-react'
import { useOperationStore } from '@/lib/stores/operationStore'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'

export function StatusBar() {
  const { scale, setScale, summary } = useCanvasZoom()
  const { t } = useTranslation()
  const operation = useOperationStore((state) => state.operation)

  return (
    <div className='luxury-border-subtle bg-card text-foreground flex shrink-0 items-center justify-between gap-4 border-t px-4 py-2 text-xs'>
      {/* Keyboard Shortcuts */}
      <div className='flex items-center'>
        <KeyboardShortcuts />
      </div>

      <div className='flex items-center gap-4'>
        {/* Operation Progress Indicator */}
        {operation && (
          <div className='flex items-center gap-2' role='status' aria-live='polite'>
            <LoaderCircleIcon className='text-luxury-gold size-3 animate-spin' aria-hidden='true' />
            <span className='text-muted-foreground font-mono text-[10px] uppercase'>
              {operation.step === 'detect' ? t('statusBar.detecting') : t('statusBar.ocr')}
            </span>
          </div>
        )}

        <div className='flex items-center gap-1.5'>
          <span className='text-muted-foreground font-mono text-[10px] font-medium tracking-[0.15em] uppercase'>
            {t('statusBar.zoom')}
          </span>
          <Slider
            data-testid='zoom-slider'
            className='[&_[data-slot=slider-range]]:bg-luxury-gold [&_[data-slot=slider-thumb]]:border-luxury-gold [&_[data-slot=slider-thumb]]:bg-background [&_[data-slot=slider-thumb]]:luxury-shadow [&_[data-slot=slider-track]]:bg-border w-48 [&_[data-slot=slider-thumb]]:size-3.5 [&_[data-slot=slider-thumb]]:border-2'
            min={10}
            max={300}
            step={5}
            value={[scale]}
            onValueChange={(v) => setScale(v[0] ?? scale)}
          />
          <div className='luxury-border luxury-shadow bg-luxury-gold-text text-background rounded-sm px-2 py-0.5 font-mono text-[10px] font-medium tabular-nums'>
            {scale}%
          </div>
        </div>
        <div className='luxury-border-subtle bg-luxury-gold/10 text-luxury-gold-text rounded-sm px-2 py-0.5 font-mono text-[10px] font-medium'>
          {t('statusBar.canvas')}: {summary}
        </div>
      </div>
    </div>
  )
}
