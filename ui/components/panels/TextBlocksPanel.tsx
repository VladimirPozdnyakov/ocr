'use client'

import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { TextBlock } from '@/types'
import { ActivityIcon, CpuIcon } from 'lucide-react'
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

export function TextBlocksPanel() {
  const {
    document,
    textBlocks,
    selectedBlockIndex,
    setSelectedBlockIndex,
    replaceBlock,
    removeBlock,
  } = useTextBlocks()
  const { t } = useTranslation()

  if (!document) {
    return (
      <div className='text-muted-foreground luxury-dots font-inter flex flex-1 items-center justify-center text-xs'>
        <div className='text-center'>
          <div className='luxury-border luxury-shadow-xl bg-luxury-gold/10 mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full'>
            <ActivityIcon className='text-luxury-gold size-6' />
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

  return (
    <div
      className='luxury-lines bg-background/50 flex min-h-0 flex-1 flex-col'
      data-testid='panels-textblocks'
    >
      {/* Luxury Editorial Header */}
      <div className='luxury-border-subtle bg-luxury-gold/10 border-b px-4 py-3'>
        <div className='flex items-center gap-2.5'>
          <div className='luxury-border luxury-shadow bg-luxury-navy text-luxury-gold flex size-6 items-center justify-center rounded-full'>
            <ActivityIcon className='size-3.5' />
          </div>
          <div className='flex-1'>
            <div className='text-luxury-gold font-mono text-[9px] font-medium tracking-[0.2em] uppercase'>
              SCAN RESULTS
            </div>
            <div className='font-poppins text-foreground text-lg font-semibold tabular-nums'>
              {String(textBlocks.length).padStart(2, '0')}
            </div>
          </div>
          <div className='font-poppins text-luxury-gold text-[9px] font-medium'>
            BLOCKS
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
            <div className='luxury-border luxury-shadow bg-background rounded-sm p-4 text-center'>
              <div className='text-luxury-rose font-poppins mb-2 text-xs font-medium'>
                NO DATA
              </div>
              <p className='text-muted-foreground font-inter text-[10px] tracking-[0.15em] uppercase'>
                {t('textBlocks.none')}
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
                  onChange={(updates) => void replaceBlock(index, updates)}
                  onDelete={() => void handleDelete(index)}
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
  onChange: (updates: Partial<TextBlock>) => void
  onDelete: () => void | Promise<void>
}

function BlockCard({
  block,
  index,
  total,
  selected,
  onChange,
  onDelete: _onDelete,
}: BlockCardProps) {
  const { t } = useTranslation()
  const hasOcr = !!block.text?.trim()
  const preview = block.text?.trim()

  // Detector badge styling
  const getDetectorStyle = (detector?: string) => {
    if (!detector) return null
    const normalized = detector.toLowerCase()
    if (normalized.includes('ctd') || normalized.includes('comic')) {
      return {
        color: 'text-luxury-sage',
        bg: 'bg-luxury-sage/10',
        border: 'border-luxury-sage/30',
        icon: 'CTD',
      }
    }
    if (normalized.includes('doc') || normalized.includes('layout')) {
      return {
        color: 'text-luxury-gold',
        bg: 'bg-luxury-gold/10',
        border: 'border-luxury-gold/30',
        icon: 'PPD',
      }
    }
    return {
      color: 'text-luxury-navy',
      bg: 'bg-luxury-navy/10',
      border: 'border-luxury-navy/30',
      icon: 'ML',
    }
  }

  const detectorStyle = getDetectorStyle(block.detector)

  return (
    <motion.div
      data-testid={`textblock-card-${index}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className='relative'
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

        <AccordionTrigger className='data-[state=open]:bg-luxury-gold/10 hover:bg-luxury-gold/5 relative flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition-all outline-none [&>svg]:hidden'>
          {/* Block Number - Luxury Editorial Display */}
          <div className='shrink-0'>
            <div className='luxury-border luxury-shadow bg-luxury-gold text-background min-w-[2rem] rounded-sm px-1.5 py-0.5 text-center font-mono text-[10px] font-medium tabular-nums'>
              {String(index + 1).padStart(2, '0')}
            </div>
          </div>

          {/* Status Badges */}
          <div className='flex min-w-0 flex-1 items-center gap-1.5'>
            {/* OCR Status Badge */}
            <div className='shrink-0'>
              {hasOcr ? (
                <div className='luxury-border-subtle luxury-shadow bg-luxury-gold/10 flex items-center gap-1.5 rounded px-1.5 py-0.5'>
                  <div className='bg-luxury-gold size-1.5 animate-pulse rounded-full' />
                  <span className='text-luxury-gold font-mono text-[9px] font-medium uppercase'>
                    OCR
                  </span>
                </div>
              ) : (
                <div className='luxury-border-subtle luxury-shadow bg-muted/50 flex items-center gap-1 rounded px-1.5 py-0.5'>
                  <div className='bg-muted-foreground size-1.5' />
                  <span className='text-muted-foreground font-mono text-[9px] font-medium uppercase'>
                    RAW
                  </span>
                </div>
              )}
            </div>

            {/* Detector Badge - Technical Display */}
            {detectorStyle && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-center gap-1 rounded ${detectorStyle.bg} border px-1.5 py-0.5 ${detectorStyle.border} shrink-0`}
                  >
                    <CpuIcon className={`${detectorStyle.color} size-2.5`} />
                    <span
                      className={`font-mono text-[9px] font-bold uppercase ${detectorStyle.color}`}
                    >
                      {detectorStyle.icon}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side='top'
                  className='border-slate-700 bg-slate-900 text-slate-200'
                >
                  <div className='font-mono text-[10px]'>
                    <div className='mb-1 tracking-wider text-slate-500 uppercase'>
                      Detector
                    </div>
                    <div className='font-bold'>{block.detector}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Text Preview */}
            {preview && (
              <div className='min-w-0 flex-1'>
                <p className='text-foreground truncate font-mono text-[10px]'>
                  {preview}
                </p>
              </div>
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent className='luxury-border-subtle bg-muted/30 border-t px-3 py-2'>
          <div className='space-y-2'>
            {/* Luxury Editorial label */}
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground font-mono text-[9px] font-medium tracking-[0.15em] uppercase'>
                Extracted Text
              </span>
              <span className='luxury-border-subtle bg-card text-muted-foreground rounded-sm px-1.5 py-0.5 font-mono text-[9px]'>
                {block.detector || 'UNKNOWN'}
              </span>
            </div>

            {/* Textarea with Luxury Editorial styling */}
            <div className='relative max-w-[280px]'>
              <DraftTextarea
                data-testid={`textblock-ocr-${index}`}
                value={block.text ?? ''}
                placeholder={t('textBlocks.addOcrPlaceholder')}
                onValueChange={(value) => onChange({ text: value })}
                className='luxury-border luxury-shadow bg-card text-foreground focus:border-luxury-gold focus:ring-luxury-gold/20 max-h-48 min-h-[60px] w-full resize-y rounded-sm px-3 py-2 font-mono text-[10px]'
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
}
