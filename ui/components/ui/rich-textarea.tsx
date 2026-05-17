'use client'

import { useState, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  EraserIcon,
  CopyIcon,
  CheckIcon,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type RichTextareaProps = {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextarea({
  value,
  onValueChange,
  placeholder = 'Enter text...',
  minHeight = '120px',
}: RichTextareaProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }, [value])

  const handleClear = useCallback(() => {
    onValueChange('')
  }, [onValueChange])

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-1 rounded-md bg-muted/50 p-1'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon-xs'
              onClick={handleCopy}
              className='size-7 hover:bg-luxury-gold/20'
              disabled={!value}
            >
              {copied ? (
                <CheckIcon className='size-3.5 text-green-500' />
              ) : (
                <CopyIcon className='size-3.5' />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy text</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon-xs'
              onClick={handleClear}
              className='size-7 hover:bg-red-500/20'
              disabled={!value}
            >
              <EraserIcon className='size-3.5' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear text</TooltipContent>
        </Tooltip>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className='w-full resize-y font-mono text-xs'
        style={{ minHeight }}
      />
    </div>
  )
}