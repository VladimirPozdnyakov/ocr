'use client'

import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { TextBlock } from '@/types'
import { ActivityIcon, GripVerticalIcon, RefreshCwIcon } from 'lucide-react'
import { useTextBlocks } from '@/hooks/useTextBlocks'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { DraftTextarea } from '@/components/ui/draft-textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState, useRef, memo } from 'react'

export function TextBlocksPanel() {
  const {
    document,
    textBlocks,
    selectedBlockIndex,
    setSelectedBlockIndex,
    replaceBlock,
    removeBlock,
    moveBlock,
    rescanTextBlock,
  } = useTextBlocks()
  const { t } = useTranslation()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [rescanningIndex, setRescanningIndex] = useState<number | null>(null)

  if (!document) {
    return (
      <div className='text-muted-foreground luxury-dots font-inter flex flex-1 items-center justify-center text-xs'>
        <div className='text-center'>
          <div
            className='luxury-border luxury-shadow-xl bg-luxury-gold/10 mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full'
            aria-hidden='true'
          >
            <ActivityIcon
              className='text-luxury-gold size-6'
              aria-label='No data icon'
            />
          </div>
          <p className='font-medium'>{t('textBlocks.emptyPrompt')}</p>
        </div>
      </div>
    )
  }

  const accordionValue =
    selectedBlockIndex !== undefined ? selectedBlockIndex.toString() : ''

  const handleDelete = async (blockIndex: number) => {
    await removeBlock(blockIndex)
  }

  const handleRescan = async (blockIndex: number) => {
    setRescanningIndex(blockIndex)
    try {
      await rescanTextBlock(blockIndex)
    } finally {
      setRescanningIndex(null)
    }
  }

  return (
    <div
      className='luxury-lines bg-background/50 flex min-h-0 flex-1 flex-col'
      data-testid='panels-textblocks'
    >
      {/* Luxury Editorial Header */}
      <div className='luxury-border-subtle bg-luxury-gold/10 border-b px-4 py-3'>
        <div className='flex items-center gap-2.5'>
          <div
            className='luxury-border luxury-shadow bg-luxury-gold text-background flex size-6 items-center justify-center rounded-full'
            aria-hidden='true'
          >
            <ActivityIcon
              className='size-3.5'
              aria-label={t('aria.scanResultsIcon')}
            />
          </div>
          <div className='flex-1'>
            <div className='text-luxury-gold-text font-mono text-[9px] font-medium tracking-[0.2em] uppercase'>
              {t('textBlocks.scanResults')}
            </div>
            <div className='font-poppins text-foreground text-lg font-semibold tabular-nums'>
              {String(textBlocks.length).padStart(2, '0')}
            </div>
          </div>
          <div className='font-poppins text-luxury-gold-text text-[9px] font-medium'>
            {t('textBlocks.blocks')}
          </div>
        </div>
      </div>

      <ScrollArea
        className='min-h-0 flex-1'
        viewportClassName='pb-1'
        data-testid='textblocks-scroll'
      >
        <div className='p-2'>
          {textBlocks.length === 0 ? (
            <div className='luxury-border luxury-shadow bg-background rounded-sm p-6 text-center'>
              <div
                className='luxury-border luxury-shadow-xl bg-luxury-gold/10 mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full'
                aria-hidden='true'
              >
                <ActivityIcon
                  className='text-luxury-gold size-6'
                  aria-label={t('aria.noTextBlocksIcon')}
                />
              </div>
              <h3 className='text-foreground font-poppins mb-2 text-sm font-semibold'>
                {t('textBlocks.noTextBlocks')}
              </h3>
              <p className='text-muted-foreground font-inter mb-4 text-xs'>
                {t('textBlocks.runDetection')}
              </p>
            </div>
          ) : (
            <Accordion
              data-testid='textblocks-accordion'
              type='single'
              collapsible
              value={accordionValue}
              onValueChange={(value) => {
                if (!value) {
                  setSelectedBlockIndex(undefined)
                  return
                }
                setSelectedBlockIndex(Number(value))
              }}
              className='flex flex-col gap-1.5'
            >
              {textBlocks.map((block, index) => (
                <BlockCard
                  key={`${document.id}-${index}`}
                  block={block}
                  index={index}
                  total={textBlocks.length}
                  selected={index === selectedBlockIndex}
                  isDragging={draggedIndex === index}
                  isDragOver={dragOverIndex === index}
                  isRescanning={rescanningIndex === index}
                  onChange={(updates) => void replaceBlock(index, updates)}
                  onDelete={() => void handleDelete(index)}
                  onRescan={() => void handleRescan(index)}
                  onDragStart={() => setDraggedIndex(index)}
                  onDragEnd={() => {
                    if (
                      draggedIndex !== null &&
                      dragOverIndex !== null &&
                      draggedIndex !== dragOverIndex
                    ) {
                      void moveBlock(draggedIndex, dragOverIndex)
                    }
                    setDraggedIndex(null)
                    setDragOverIndex(null)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (draggedIndex !== null && draggedIndex !== index) {
                      setDragOverIndex(index)
                    }
                  }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={() => {}}
                />
              ))}
            </Accordion>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

type BlockCardProps = {
  block: TextBlock
  index: number
  total: number
  selected: boolean
  isDragging: boolean
  isDragOver: boolean
  isRescanning: boolean
  onChange: (updates: Partial<TextBlock>) => void
  onDelete: () => void | Promise<void>
  onRescan: () => void | Promise<void>
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: () => void
}

const BlockCard = memo(
  function BlockCard({
    block,
    index,
    total,
    selected,
    isDragging,
    isDragOver,
    isRescanning,
    onChange,
    onDelete: _onDelete,
    onRescan,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
  }: BlockCardProps) {
    const { t } = useTranslation()
    const preview = block.text?.trim()
    const dragHandleRef = useRef<HTMLDivElement>(null)

    return (
      <motion.div
        data-testid={`textblock-card-${index}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0, scale: isDragging ? 1.02 : 1 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        className={`relative ${isDragging ? 'opacity-60' : ''} ${isDragOver ? 'border-luxury-gold border-t-2 pt-2' : ''}`}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <AccordionItem
          value={index.toString()}
          className={`luxury-border overflow-hidden rounded-sm transition-all duration-300 ${
            selected
              ? 'luxury-shadow-xl bg-luxury-gold/10'
              : 'luxury-shadow bg-card'
          }`}
        >
          {/* Luxury Editorial border indicators */}
          {selected && (
            <motion.div
              layoutId='activeBlock'
              className='luxury-border-subtle border-luxury-gold pointer-events-none absolute inset-0 rounded-sm'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          <AccordionTrigger className='data-[state=open]:bg-luxury-gold/10 hover:bg-luxury-gold/5 active:bg-luxury-gold/10 relative flex min-h-[44px] w-full cursor-pointer items-center gap-2 overflow-hidden px-3 py-2 text-left transition-all outline-none [&>svg]:hidden'>
            {/* Drag Handle */}
            <div
              ref={dragHandleRef}
              className='text-muted-foreground hover:text-luxury-gold cursor-grab transition-colors active:cursor-grabbing'
              aria-label='Drag to reorder'
            >
              <GripVerticalIcon className='size-4' />
            </div>

            {/* Block Number - Luxury Editorial Display */}
            <div className='shrink-0'>
              <div className='luxury-border luxury-shadow bg-luxury-gold-text text-background min-w-[2rem] rounded-sm px-1.5 py-0.5 text-center font-mono text-[10px] font-medium tabular-nums'>
                {String(index + 1).padStart(2, '0')}
              </div>
            </div>

            {/* Text Preview */}
            {preview && (
              <div className='min-w-0 flex-1'>
                <p className='text-foreground truncate font-mono text-[10px]'>
                  {preview}
                </p>
              </div>
            )}
          </AccordionTrigger>

          <AccordionContent className='luxury-border-subtle bg-muted/30 overflow-hidden border-t px-3 py-2'>
            <div className='space-y-2'>
              {/* Luxury Editorial label with rescan button */}
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground font-mono text-[9px] font-medium tracking-[0.15em] uppercase'>
                  Extracted Text
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        onRescan()
                      }}
                      disabled={isRescanning}
                      className='text-muted-foreground hover:text-luxury-gold rounded p-1 transition-colors disabled:opacity-50'
                      aria-label={t('textBlocks.rescan')}
                    >
                      <RefreshCwIcon
                        className={`size-3.5 ${isRescanning ? 'animate-spin' : ''}`}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='top'>
                    {t('textBlocks.rescan')}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Textarea with Luxury Editorial styling */}
              <div className='relative min-w-0'>
                <DraftTextarea
                  data-testid={`textblock-ocr-${index}`}
                  value={block.text ?? ''}
                  placeholder={t('textBlocks.addOcrPlaceholder')}
                  onValueChange={(value) => onChange({ text: value })}
                  className='luxury-border luxury-shadow bg-card text-foreground focus:border-luxury-gold focus:ring-luxury-gold/20 max-h-48 min-h-[60px] w-full resize-y overflow-x-hidden rounded-sm px-3 py-2 font-mono text-[10px] break-all'
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Connection line to next block */}
        {index < total - 1 && (
          <div className='flex justify-center py-1'>
            <div className='luxury-accent-line bg-luxury-gold/30 h-px w-8' />
          </div>
        )}
      </motion.div>
    )
  },
  (prev, next) =>
    prev.block === next.block &&
    prev.index === next.index &&
    prev.total === next.total &&
    prev.selected === next.selected &&
    prev.isDragging === next.isDragging &&
    prev.isDragOver === next.isDragOver &&
    prev.isRescanning === next.isRescanning,
)
