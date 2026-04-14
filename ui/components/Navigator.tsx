'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'
import { useDocumentsCountQuery, useThumbnailQuery } from '@/lib/query/hooks'
import { useEditorUiStore } from '@/lib/stores/editorUiStore'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LoaderCircleIcon } from 'lucide-react'
import { flushTextBlockSync } from '@/lib/services/syncQueues'
import { cancelObjectUrlRevoke, revokeObjectUrlLater } from '@/lib/util'

type PagePreviewProps = {
  index: number
  documentsVersion: number
  selected: boolean
  onSelect: () => void
}

export const Navigator = memo(function Navigator() {
  const { data: totalPagesData = 0 } = useDocumentsCountQuery()
  const totalPages = totalPagesData ?? 0
  const documentsVersion = useEditorUiStore((state) => state.documentsVersion)
  const currentDocumentIndex = useEditorUiStore(
    (state) => state.currentDocumentIndex,
  )
  const setCurrentDocumentIndex = useEditorUiStore(
    (state) => state.setCurrentDocumentIndex,
  )
  const listRef = useRef<HTMLDivElement | null>(null)
  const indices = useMemo(
    () => Array.from({ length: totalPages }, (_, idx) => idx),
    [totalPages],
  )
  const rowVirtualizer = useVirtualizer({
    count: indices.length,
    getScrollElement: () => listRef.current,
    getItemKey: (index) => indices[index] ?? index,
    estimateSize: () => 320,
    overscan: 8,
    measureElement: (element) => element.getBoundingClientRect().height,
  })
  const { t } = useTranslation()

  useEffect(() => {
    rowVirtualizer.measure()
  }, [rowVirtualizer, totalPages, documentsVersion])

  return (
    <div
      data-testid='navigator-panel'
      data-total-pages={totalPages}
      className='luxury-border-subtle bg-card flex h-full min-h-0 w-full flex-col border-r'
    >
      <div className='luxury-border-subtle bg-luxury-gold/5 border-b px-4 py-3'>
        <p className='text-luxury-gold font-poppins text-xs font-semibold tracking-[0.2em] uppercase'>
          {t('navigator.title')}
        </p>
        <p className='text-foreground font-inter text-sm font-medium'>
          {totalPages
            ? t('navigator.pages', { count: totalPages })
            : t('navigator.empty')}
        </p>
      </div>

      <div className='text-muted-foreground flex items-center gap-1.5 px-2 py-2 text-xs'>
        {totalPages > 0 ? (
          <div className='luxury-border luxury-shadow bg-luxury-gold-text text-background rounded-sm px-2 py-0.5 font-mono text-[10px]'>
            #{currentDocumentIndex + 1}
          </div>
        ) : (
          <span className='font-inter'>{t('navigator.prompt')}</span>
        )}
      </div>

      <ScrollArea className='min-h-0 flex-1' viewportRef={listRef}>
        <div className='p-2'>
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const idx = indices[virtualRow.index]
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: '6px',
                  }}
                >
                  <PagePreview
                    index={idx}
                    documentsVersion={documentsVersion}
                    selected={idx === currentDocumentIndex}
                    onSelect={() => {
                      void flushTextBlockSync()
                        .catch(() => {})
                        .finally(() => {
                          setCurrentDocumentIndex(idx)
                        })
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
})

function PagePreview({
  index,
  documentsVersion,
  selected,
  onSelect,
}: PagePreviewProps) {
  const [preview, setPreview] = useState<string>()
  const {
    data: thumbnailBlob,
    isPending: loading,
    isError: error,
  } = useThumbnailQuery(index, documentsVersion)

  useLayoutEffect(() => {
    if (!thumbnailBlob) {
      setPreview(undefined)
      return
    }
    const url = URL.createObjectURL(thumbnailBlob)
    cancelObjectUrlRevoke(url)
    setPreview(url)
    return () => {
      revokeObjectUrlLater(url)
    }
  }, [thumbnailBlob])

  return (
    <Button
      variant='ghost'
      onClick={onSelect}
      data-testid={`navigator-page-${index}`}
      data-page-index={index}
      data-selected={selected}
      className='luxury-border luxury-shadow bg-card data-[selected=true]:luxury-shadow-xl data-[selected=true]:bg-luxury-gold data-[selected=true]:text-background active:scale-95 cursor-pointer flex h-auto min-h-[44px] flex-col gap-2 rounded-sm border p-3 text-left transition-all duration-150 hover:shadow-lg'
    >
      {loading ? (
        <div className='luxury-border bg-muted relative aspect-3/4 w-full overflow-hidden rounded-sm'>
          <div className='absolute inset-0 luxury-shimmer bg-gradient-to-r from-transparent via-luxury-gold/10 to-transparent' />
          <div className='absolute inset-0 flex items-center justify-center'>
            <LoaderCircleIcon className='text-luxury-gold/50 size-8 animate-spin' />
          </div>
        </div>
      ) : error ? (
        <div className='luxury-border bg-luxury-rose/10 flex aspect-3/4 w-full items-center justify-center rounded-sm'>
          <span className='text-luxury-rose font-poppins text-lg'>?</span>
        </div>
      ) : preview ? (
        <div className='luxury-border overflow-hidden rounded-sm'>
          <img
            src={preview}
            alt={`Page ${index + 1}`}
            loading='lazy'
            className='aspect-3/4 w-full rounded-sm object-cover'
          />
        </div>
      ) : (
        <div className='bg-muted luxury-dots aspect-3/4 w-full rounded-sm' />
      )}
      <div className='text-muted-foreground flex flex-1 items-center text-xs'>
        <div className='luxury-border luxury-shadow bg-luxury-gold-text text-background font-poppins mx-auto flex size-6 items-center justify-center rounded-full text-center font-semibold'>
          {index + 1}
        </div>
      </div>
    </Button>
  )
}
