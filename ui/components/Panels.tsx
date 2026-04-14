'use client'

import { memo } from 'react'
import { TextBlocksPanel } from '@/components/panels/TextBlocksPanel'

export const Panels = memo(function Panels() {
  return (
    <div className='luxury-border-subtle bg-card flex h-full min-h-0 w-full flex-col border-l '>
      <TextBlocksPanel />
    </div>
  )
})
