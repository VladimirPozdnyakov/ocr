'use client'

import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import { memo } from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { useGesture } from '@use-gesture/react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useTranslation } from 'react-i18next'
import { Image } from '@/components/Image'
import {
  setCanvasViewport,
  fitCanvasToViewport,
} from '@/components/canvas/canvasViewport'
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar'
import { TextBlockAnnotations } from '@/components/canvas/TextBlockAnnotations'
import { TextBlockSpriteLayer } from '@/components/canvas/TextBlockSpriteLayer'
import { useCanvasZoom } from '@/hooks/useCanvasZoom'
import { usePointerToDocument } from '@/hooks/usePointerToDocument'
import { useBlockDrafting } from '@/hooks/useBlockDrafting'
import { useBlockContextMenu } from '@/hooks/useBlockContextMenu'
import { useTextBlocks } from '@/hooks/useTextBlocks'
import { useEditorUiStore } from '@/lib/stores/editorUiStore'
import {
  resolvePinchMemoScaleRatio,
  resolvePinchNextScaleRatio,
} from '@/components/canvas/zoomGestures'

const PAN_STEP = 50

export const Workspace = memo(function Workspace() {
  const scale = useEditorUiStore((state) => state.scale)
  const showTextBlocksOverlay = useEditorUiStore(
    (state) => state.showTextBlocksOverlay,
  )
  const mode = useEditorUiStore((state) => state.mode)
  const autoFitEnabled = useEditorUiStore((state) => state.autoFitEnabled)
  const {
    document: currentDocument,
    selectedBlockIndex,
    setSelectedBlockIndex,
    clearSelection,
    appendBlock,
    removeBlock,
  } = useTextBlocks()
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const { setScale: applyScale } = useCanvasZoom()
  const scaleRatio = scale / 100
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const pointerToDocument = usePointerToDocument(scaleRatio, canvasRef)
  const { draftBlock, bind: bindBlockDraft } = useBlockDrafting({
    mode,
    currentDocument,
    pointerToDocument,
    clearSelection,
    onCreateBlock: (block) => {
      void appendBlock(block)
    },
  })
  const blockDraftBindings = bindBlockDraft()
  const [isPanning, setIsPanning] = useState(false)

  useEffect(() => {
    if (currentDocument && autoFitEnabled) {
      fitCanvasToViewport()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDocument?.id, autoFitEnabled])
  const {
    contextMenuBlockIndex,
    handleContextMenu,
    handleDeleteBlock,
    clearContextMenu,
  } = useBlockContextMenu({
    currentDocument,
    pointerToDocument,
    selectBlock: setSelectedBlockIndex,
    removeBlock: (index) => {
      void removeBlock(index)
    },
  })
  const { t } = useTranslation()

  useEffect(() => {
    if (!currentDocument) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const viewport = viewportRef.current
      if (!viewport) return

      let dx = 0
      let dy = 0

      switch (event.key) {
        case 'ArrowUp':
          dy = -PAN_STEP
          break
        case 'ArrowDown':
          dy = PAN_STEP
          break
        case 'ArrowLeft':
          dx = -PAN_STEP
          break
        case 'ArrowRight':
          dx = PAN_STEP
          break
        default:
          return
      }

      event.preventDefault()
      viewport.scrollLeft += dx
      viewport.scrollTop += dy
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentDocument])

  // Listen for window resize events
  useEffect(() => {
    const handleResize = () => {
      if (currentDocument && autoFitEnabled) {
        fitCanvasToViewport()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentDocument, autoFitEnabled])

  useGesture(
    {
      onDrag: ({ first, movement: [mx, my], memo, cancel, ctrlKey, event }) => {
        if (!currentDocument) return memo

        const mouseEvent = event as MouseEvent
        const isMiddleButton = mouseEvent.button === 1
        const isCtrlDrag = ctrlKey && mouseEvent.button === 0

        if (!isMiddleButton && !isCtrlDrag) {
          if (first && cancel) cancel()
          return memo
        }

        const viewport = viewportRef.current
        if (!viewport) return memo

        if (first) {
          if (isMiddleButton) setIsPanning(true)
          return {
            scrollLeft: viewport.scrollLeft,
            scrollTop: viewport.scrollTop,
          }
        }

        if (!memo) return memo
        viewport.scrollLeft = memo.scrollLeft - mx
        viewport.scrollTop = memo.scrollTop - my
        return memo
      },
      onDragEnd: ({ event }) => {
        const mouseEvent = event as MouseEvent
        if (mouseEvent.button === 1) setIsPanning(false)
      },
      onWheel: ({ ctrlKey, delta: [, dy], event }) => {
        if (!currentDocument || !ctrlKey) return

        if (event.cancelable) {
          event.preventDefault()
        }

        const direction = Math.sign(dy)
        if (!direction) return
        const currentScale = useEditorUiStore.getState().scale
        applyScale(currentScale - direction)
      },
      onPinch: ({ canceled, movement: [movementScale], memo }) => {
        if (!currentDocument || canceled) return memo
        const memoScaleRatio = resolvePinchMemoScaleRatio(
          memo,
          useEditorUiStore.getState().scale / 100,
        )
        const nextScaleRatio = resolvePinchNextScaleRatio(
          memoScaleRatio,
          movementScale,
        )
        applyScale(nextScaleRatio * 100)
        return memoScaleRatio
      },
    },
    {
      target: viewportRef,
      eventOptions: { passive: false },
      drag: {
        filterTaps: true,
        buttons: [0, 1],
      },
      wheel: {
        preventDefault: true,
      },
      pinch: {
        threshold: 0.1,
        enabled: true,
        pinchOnWheel: false,
        preventDefault: true,
        scaleBounds: { min: 0.1, max: 1 },
        from: () => [useEditorUiStore.getState().scale / 100, 0],
      },
    },
  )

  const handleCanvasPointerDownCapture = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.button === 1) {
      event.preventDefault()
    }
    if (mode !== 'block' && event.target === event.currentTarget) {
      clearSelection()
    }
  }

  const handleCanvasContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    handleContextMenu(event)
  }

  const canvasCursor = isPanning
    ? 'grabbing'
    : mode === 'block'
      ? 'cell'
      : 'default'

  const canvasDimensions = currentDocument
    ? {
        width: currentDocument.width * scaleRatio,
        height: currentDocument.height * scaleRatio,
      }
    : { width: 0, height: 0 }

  return (
    <div className='bg-background flex min-h-0 min-w-0 flex-1'>
      <div className='relative flex min-h-0 min-w-0 flex-1 flex-col'>
        <CanvasToolbar />
        <ScrollAreaPrimitive.Root className='flex min-h-0 min-w-0 flex-1'>
          <ScrollAreaPrimitive.Viewport
            ref={(el) => {
              viewportRef.current = el
              setCanvasViewport(el)
            }}
            data-testid='workspace-viewport'
            className='grid size-full place-content-center-safe'
          >
            {currentDocument ? (
              <ContextMenu
                onOpenChange={(open) => {
                  if (!open) {
                    clearContextMenu()
                  }
                }}
              >
                <ContextMenuTrigger asChild>
                  <div className='grid place-items-center'>
                    <div
                      ref={canvasRef}
                      data-testid='workspace-canvas'
                      className='luxury-border-subtle luxury-shadow-xl border-border bg-card relative rounded-sm border'
                      style={{ ...canvasDimensions, cursor: canvasCursor }}
                      onPointerDownCapture={handleCanvasPointerDownCapture}
                      onContextMenuCapture={handleCanvasContextMenu}
                      onAuxClick={(e) => e.preventDefault()}
                      {...blockDraftBindings}
                    >
                      <div className='absolute inset-0'>
                        <Image
                          data={currentDocument.image}
                          dataKey={`${currentDocument.id}-base`}
                          transition={false}
                        />
                        {showTextBlocksOverlay && (
                          <TextBlockSpriteLayer
                            blocks={currentDocument?.textBlocks}
                            scale={scaleRatio}
                            visible={true}
                            style={{ zIndex: 30 }}
                          />
                        )}
                        {showTextBlocksOverlay && (
                          <TextBlockAnnotations
                            selectedIndex={selectedBlockIndex}
                            onSelect={setSelectedBlockIndex}
                            style={{ zIndex: 30 }}
                          />
                        )}
                      </div>
                      {draftBlock && (
                        <div
                          className='luxury-border-subtle border-luxury-rose bg-luxury-rose/10 luxury-fade-in pointer-events-none absolute rounded-sm border-2 border-dashed'
                          style={{
                            left: draftBlock.x * scaleRatio,
                            top: draftBlock.y * scaleRatio,
                            width: Math.max(0, draftBlock.width * scaleRatio),
                            height: Math.max(0, draftBlock.height * scaleRatio),
                          }}
                        />
                      )}
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className='min-w-32'>
                  <ContextMenuItem
                    disabled={contextMenuBlockIndex === undefined}
                    onSelect={handleDeleteBlock}
                  >
                    {t('workspace.deleteBlock')}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ) : (
              <div className='text-muted-foreground font-inter bg-muted/30 flex h-full w-full items-center justify-center text-sm'>
                <div className='luxury-border luxury-shadow-xl bg-card rounded-sm px-8 py-5'>
                  <p className='text-center'>{t('workspace.importPrompt')}</p>
                </div>
              </div>
            )}
          </ScrollAreaPrimitive.Viewport>
          <ScrollAreaPrimitive.Scrollbar
            orientation='vertical'
            className='flex w-2 touch-none p-px select-none'
          >
            <ScrollAreaPrimitive.Thumb className='bg-muted-foreground/40 flex-1 rounded' />
          </ScrollAreaPrimitive.Scrollbar>
          <ScrollAreaPrimitive.Scrollbar
            orientation='horizontal'
            className='flex h-2 touch-none p-px select-none'
          >
            <ScrollAreaPrimitive.Thumb className='bg-muted-foreground/40 rounded' />
          </ScrollAreaPrimitive.Scrollbar>
        </ScrollAreaPrimitive.Root>
      </div>
    </div>
  )
})
