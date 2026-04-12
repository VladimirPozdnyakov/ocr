'use client'

import { TextBlock } from '@/types'

type TextBlockSpriteLayerProps = {
  blocks?: TextBlock[]
  scale: number
  visible: boolean
  style?: React.CSSProperties
}

export function TextBlockSpriteLayer({
  visible,
  style,
}: TextBlockSpriteLayerProps) {
  // Rendering functionality has been removed
  return (
    <div
      data-text-sprite-layer
      aria-hidden
      style={{
        ...style,
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        display: 'none',
      }}
    />
  )
}
