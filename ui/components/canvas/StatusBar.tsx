'use client'

import { useTranslation } from 'react-i18next'
import { useCanvasZoom } from '@/hooks/useCanvasZoom'
import { Slider } from '@/components/ui/slider'

export function StatusBar() {
  const { scale, setScale, summary } = useCanvasZoom()
  const { t } = useTranslation()

  return (
    <div className='luxury-border-subtle bg-card text-foreground flex shrink-0 items-center justify-end gap-4 border-t px-4 py-2 text-xs'>
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
        <div className='luxury-border luxury-shadow bg-luxury-navy text-luxury-gold rounded-sm px-2 py-0.5 font-mono text-[10px] font-medium tabular-nums'>
          {scale}%
        </div>
      </div>
      <div className='luxury-border-subtle bg-luxury-gold/10 text-luxury-gold rounded-sm px-2 py-0.5 font-mono text-[10px] font-medium'>
        {t('statusBar.canvas')}: {summary}
      </div>
    </div>
  )
}
