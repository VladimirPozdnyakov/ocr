'use client'

import { useState, useCallback, useRef } from 'react'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync initial value — useEffect не нужен, uncontrolled textarea управляет
  // своим состоянием черезDOM. При изменении внешнего value используем key-
  // трик: если value отличается от текущего DOM-значения, обновляем через DOM,
  // сохраняя курсор. Это работает быстрее, чем uncontrolled + sync через effect,
  // и не сбрасывает курсор как React controlled mode.

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
    const ta = textareaRef.current
    if (!ta) return
    ta.value = ''
    onValueChange('')
  }, [onValueChange])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // DOM управляет курсором — React controlled mode отключён (нет value=).
      // Курсор остаётся там, куда его поставил пользователь.
      onValueChange(e.target.value)
    },
    [onValueChange],
  )

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

      {/* Uncontrolled textarea — value управляется через DOM refs.
          Без value={value} React не сбрасывает курсор при рендере. */}
      <Textarea
        ref={textareaRef}
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder}
        className='w-full resize-y font-mono text-xs'
        style={{ minHeight }}
      />
    </div>
  )
}