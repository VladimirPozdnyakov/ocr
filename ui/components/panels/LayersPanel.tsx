'use client'

import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { TextBlock } from '@/types'
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UnlockIcon,
  LayersIcon,
  GripVerticalIcon,
} from 'lucide-react'
import { useTextBlocks } from '@/hooks/useTextBlocks'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState, memo } from 'react'

export function LayersPanel() {
  const { document, textBlocks, selectedBlockIndex, setSelectedBlockIndex } =
    useTextBlocks()
  const { t } = useTranslation()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  if (!document) {
    return (
      <div className='text-muted-foreground font-inter flex flex-1 items-center justify-center text-xs'>
        <div className='text-center'>
          <div className='luxury-border luxury-shadow-xl bg-luxury-gold/10 mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full'>
            <LayersIcon className='text-luxury-gold size-6' />
          </div>
          <p className='font-medium'>{t('layers.emptyPrompt')}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className='luxury-lines bg-background/50 flex min-h-0 flex-1 flex-col'
      data-testid='panels-layers'
    >
      <div className='luxury-border-subtle bg-luxury-gold/10 border-b px-4 py-3'>
        <div className='flex items-center gap-2.5'>
          <div className='luxury-border luxury-shadow bg-luxury-gold text-background flex size-6 items-center justify-center rounded-full'>
            <LayersIcon className='size-3.5' />
          </div>
          <div className='flex-1'>
            <div className='text-luxury-gold-text font-mono text-[9px] font-medium tracking-[0.2em] uppercase'>
              {t('layers.title')}
            </div>
            <div className='font-poppins text-foreground text-lg font-semibold tabular-nums'>
              {String(textBlocks.length).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className='min-h-0 flex-1' viewportClassName='pb-1'>
        <div className='p-2 space-y-1'>
          {textBlocks.length === 0 ? (
            <div className='luxury-border luxury-shadow bg-background rounded-sm p-6 text-center'>
              <div className='text-muted-foreground font-inter text-xs'>
                {t('layers.noLayers')}
              </div>
            </div>
          ) : (
            textBlocks.map((block, index) => (
              <LayerCard
                key={`layer-${index}`}
                block={block}
                index={index}
                selected={index === selectedBlockIndex}
                onSelect={() => setSelectedBlockIndex(index)}
                isDragging={draggedIndex === index}
                onDragStart={() => setDraggedIndex(index)}
                onDragEnd={() => setDraggedIndex(null)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

type LayerCardProps = {
  block: TextBlock
  index: number
  selected: boolean
  onSelect: () => void
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}

const LayerCard = memo(function LayerCard({
  block,
  index,
  selected,
  onSelect,
  isDragging,
  onDragStart,
  onDragEnd,
}: LayerCardProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const preview = block.text?.trim().slice(0, 30) || '...'

  return (
    <motion.div
      data-testid={`layer-card-${index}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={`luxury-border luxury-shadow bg-card group relative flex items-center gap-2 rounded-sm p-2 transition-all ${
        selected ? 'ring-1 ring-luxury-gold/50' : ''
      } ${isDragging ? 'opacity-50' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className='text-muted-foreground cursor-grab active:cursor-grabbing'>
        <GripVerticalIcon className='size-4' />
      </div>

      <button
        onClick={onSelect}
        className='flex-1 min-w-0 text-left'
      >
        <div className='flex items-center gap-2'>
          <div className='bg-luxury-gold/20 text-luxury-gold min-w-[2rem] rounded px-1.5 py-0.5 text-center font-mono text-[10px] font-medium'>
            {String(index + 1).padStart(2, '0')}
          </div>
          <span className='text-foreground truncate font-mono text-[10px]'>
            {preview}
          </span>
        </div>
      </button>

      <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`p-1 rounded transition-colors ${
            isVisible
              ? 'text-muted-foreground hover:text-foreground'
              : 'text-muted-foreground/40'
          }`}
          aria-label={isVisible ? 'Hide layer' : 'Show layer'}
        >
          {isVisible ? (
            <EyeIcon className='size-3.5' />
          ) : (
            <EyeOffIcon className='size-3.5' />
          )}
        </button>
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`p-1 rounded transition-colors ${
            isLocked
              ? 'text-red-500 hover:text-red-600'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label={isLocked ? 'Unlock layer' : 'Lock layer'}
        >
          {isLocked ? (
            <LockIcon className='size-3.5' />
          ) : (
            <UnlockIcon className='size-3.5' />
          )}
        </button>
      </div>
    </motion.div>
  )
})