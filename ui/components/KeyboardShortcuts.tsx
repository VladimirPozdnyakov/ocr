'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHotkeys } from 'react-hotkeys-hook'
import { KeyboardIcon, XIcon } from 'lucide-react'

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  useHotkeys('?', () => setOpen((v) => !v), [setOpen])

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='text-muted-foreground hover:text-luxury-gold flex size-[28px] items-center justify-center rounded transition-colors'
        aria-label={t('shortcuts.openModal')}
      >
        <KeyboardIcon className='size-4' />
      </button>
      {open && <ShortcutsModal onClose={() => setOpen(false)} />}
    </>
  )
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  const groups: {
    title: string
    items: { keys: string[]; label: string }[]
  }[] = [
    {
      title: t('shortcuts.group.processing'),
      items: [
        { keys: ['D'], label: t('shortcuts.detect') },
        { keys: ['O'], label: t('shortcuts.ocr') },
        { keys: ['P'], label: t('shortcuts.process') },
        { keys: ['Ctrl', 'S'], label: t('shortcuts.export') },
        { keys: [t('shortcuts.deleteKey')], label: t('shortcuts.delete') },
      ],
    },
    {
      title: t('shortcuts.group.navigation'),
      items: [
        { keys: ['PageDown'], label: t('shortcuts.nextPage') },
        { keys: ['PageUp'], label: t('shortcuts.prevPage') },
        { keys: ['Home'], label: t('shortcuts.firstPage') },
        { keys: ['End'], label: t('shortcuts.lastPage') },
      ],
    },
    {
      title: t('shortcuts.group.view'),
      items: [
        { keys: ['V'], label: t('shortcuts.selectMode') },
        { keys: ['B'], label: t('shortcuts.blockMode') },
        { keys: ['Ctrl', '='], label: t('shortcuts.zoomIn') },
        { keys: ['Ctrl', '-'], label: t('shortcuts.zoomOut') },
        { keys: ['Ctrl', t('shortcuts.wheel')], label: t('shortcuts.zoom') },
        { keys: ['Ctrl', t('shortcuts.drag')], label: t('shortcuts.pan') },
        { keys: ['MMB'], label: t('shortcuts.panMiddle') },
      ],
    },
  ]

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label={t('shortcuts.modalTitle')}
      className='fixed inset-0 z-[200] flex items-center justify-center'
      onPointerDown={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        }
      }}
    >
      <div className='absolute inset-0 bg-black/40' />
      <div
        className='luxury-border luxury-shadow-xl bg-card relative z-10 w-full max-w-lg rounded-sm p-6'
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className='mb-5 flex items-center justify-between'>
          <h2 className='text-foreground font-poppins text-sm font-semibold'>
            {t('shortcuts.modalTitle')}
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='text-muted-foreground hover:text-foreground rounded p-1 transition-colors'
            aria-label={t('confirm.cancel')}
          >
            <XIcon className='size-4' />
          </button>
        </div>

        <div className='space-y-5'>
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className='text-luxury-gold-text mb-2 font-mono text-[10px] font-medium tracking-[0.15em] uppercase'>
                {group.title}
              </h3>
              <div className='space-y-1.5'>
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className='flex items-center justify-between'
                  >
                    <span className='text-foreground font-inter text-xs'>
                      {item.label}
                    </span>
                    <div className='flex items-center gap-0.5'>
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className='luxury-border luxury-shadow-subtle bg-muted text-foreground rounded-sm px-1.5 py-0.5 font-mono text-[10px]'
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
