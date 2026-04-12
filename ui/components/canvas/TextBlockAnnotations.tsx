'use client'

import { useCallback, useState } from 'react'
import { Rnd, type RndResizeCallback, type RndDragCallback } from 'react-rnd'
import { useHotkeys } from 'react-hotkeys-hook'
import { useEditorUiStore } from '@/lib/stores/editorUiStore'
import { TextBlock } from '@/types'
import { useTextBlocks } from '@/hooks/useTextBlocks'

type TextBlockAnnotationsProps = {
  selectedIndex?: number
  onSelect: (index?: number) => void
  style?: React.CSSProperties
}

export function TextBlockAnnotations({
  selectedIndex,
  onSelect,
  style,
}: TextBlockAnnotationsProps) {
  const { textBlocks, replaceBlock, removeBlock } = useTextBlocks()
  const mode = useEditorUiStore((state) => state.mode)
  const interactive = mode === 'select' || mode === 'block'

  useHotkeys(
    'backspace,delete',
    (event) => {
      if (!interactive || selectedIndex === undefined) return
      const target = event.target as HTMLElement | null
      const isEditable = target?.closest('input, textarea, [contenteditable]')
      if (isEditable) return
      event.preventDefault()
      void removeBlock(selectedIndex)
    },
    {
      enabled: interactive,
      preventDefault: true,
      enableOnFormTags: false,
    },
    [interactive, removeBlock, selectedIndex],
  )

  return (
    <div
      data-testid='workspace-annotations'
      className='absolute inset-0'
      data-annotation-layer
      style={{
        ...style,
        pointerEvents: 'none',
      }}
    >
      {textBlocks.map((block, index) => (
        <TextBlockAnnotation
          key={`${block.x}-${block.y}-${index}`}
          block={block}
          index={index}
          selected={index === selectedIndex}
          onSelect={onSelect}
          interactive={interactive}
          onUpdate={(updates) => void replaceBlock(index, updates)}
        />
      ))}
    </div>
  )
}

type TextBlockAnnotationProps = {
  block: TextBlock
  index: number
  selected: boolean
  interactive: boolean
  onSelect: (index: number) => void
  onUpdate: (updates: Partial<TextBlock>) => void
}

function TextBlockAnnotation({
  block,
  index,
  selected,
  interactive,
  onSelect,
  onUpdate,
}: TextBlockAnnotationProps) {
  const scale = useEditorUiStore((state) => state.scale)
  const scaleRatio = scale / 100

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeSize, setResizeSize] = useState({ width: 0, height: 0 })

  const scaledSize = {
    width: Math.max(0, block.width * scaleRatio),
    height: Math.max(0, block.height * scaleRatio),
  }

  const scaledPosition = {
    x: block.x * scaleRatio,
    y: block.y * scaleRatio,
  }

  const handleDragStart: RndDragCallback = useCallback(() => {
    if (!interactive) return
    setIsDragging(true)
    onSelect(index)
  }, [interactive, index, onSelect])

  const handleDrag: RndDragCallback = useCallback(
    (_, data) => {
      if (!interactive) return
      const offsetX = data.x - scaledPosition.x
      const offsetY = data.y - scaledPosition.y
      setDragOffset({ x: offsetX, y: offsetY })
    },
    [interactive, scaledPosition.x, scaledPosition.y],
  )

  const handleDragStop: RndDragCallback = useCallback(
    (_, data) => {
      if (!interactive) return
      setIsDragging(false)
      setDragOffset({ x: 0, y: 0 })
      onUpdate({
        x: Math.round(data.x / scaleRatio),
        y: Math.round(data.y / scaleRatio),
      })
    },
    [interactive, scaleRatio, onUpdate],
  )

  const handleResizeStart = useCallback(() => {
    if (!interactive || !selected) return
    setIsResizing(true)
    onSelect(index)
  }, [interactive, selected, index, onSelect])

  const handleResize: RndResizeCallback = useCallback(
    (_, __, ref) => {
      if (!interactive || !selected) return
      setResizeSize({
        width: parseFloat(ref.style.width),
        height: parseFloat(ref.style.height),
      })
    },
    [interactive, selected],
  )

  const handleResizeStop: RndResizeCallback = useCallback(
    (_, __, ref, ___, position) => {
      if (!interactive || !selected) return
      setIsResizing(false)
      setResizeSize({ width: 0, height: 0 })
      const widthPx = parseFloat(ref.style.width)
      const heightPx = parseFloat(ref.style.height)
      onUpdate({
        x: Math.round(position.x / scaleRatio),
        y: Math.round(position.y / scaleRatio),
        width: Math.max(4, Math.round(widthPx / scaleRatio)),
        height: Math.max(4, Math.round(heightPx / scaleRatio)),
      })
    },
    [interactive, selected, scaleRatio, onUpdate],
  )

  const position = isDragging
    ? { x: scaledPosition.x + dragOffset.x, y: scaledPosition.y + dragOffset.y }
    : scaledPosition

  const size = isResizing ? resizeSize : scaledSize

  return (
    <Rnd
      size={size}
      position={position}
      bounds='parent'
      disableDragging={!interactive}
      enableResizing={
        selected && interactive
          ? {
              bottom: true,
              bottomLeft: true,
              bottomRight: true,
              left: true,
              right: true,
              top: true,
              topLeft: true,
              topRight: true,
            }
          : false
      }
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragStop={handleDragStop}
      onResizeStart={handleResizeStart}
      onResize={handleResize}
      onResizeStop={handleResizeStop}
      onMouseDown={(event) => {
        if (!interactive) return
        event.stopPropagation()
        onSelect(index)
      }}
      onPointerDown={(event: React.PointerEvent) => {
        if (!interactive) return
        event.stopPropagation()
        onSelect(index)
      }}
      style={{
        zIndex: selected ? 20 : 10,
        pointerEvents: interactive ? 'auto' : 'none',
      }}
      className='absolute'
    >
      <div className='relative h-full w-full select-none'>
        <div
          className={`absolute inset-0 rounded ${
            selected
              ? 'border-primary bg-primary/15 border-[3px]'
              : 'border-2 border-rose-400/60 bg-rose-400/5'
          }`}
        />
        <div
          className={`pointer-events-none absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold text-white shadow ${
            selected ? 'bg-primary' : 'bg-rose-400'
          }`}
        >
          {index + 1}
        </div>
      </div>
    </Rnd>
  )
}
