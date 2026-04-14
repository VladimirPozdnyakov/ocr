'use client'

import { useTranslation } from 'react-i18next'

export function KeyboardShortcuts() {
  const { t } = useTranslation()

  return (
    <div className='flex items-center gap-3 text-muted-foreground'>
      <div className='flex items-center gap-1'>
        <kbd className='luxury-border luxury-shadow-subtle bg-muted rounded-sm px-1.5 py-0.5 font-mono text-[9px]'>
          {t('shortcuts.ctrl')}
        </kbd>
        <span className='text-[9px]'>{t('shortcuts.plus')}</span>
        <kbd className='luxury-border luxury-shadow-subtle bg-muted rounded-sm px-1.5 py-0.5 font-mono text-[9px]'>
          {t('shortcuts.wheel')}
        </kbd>
      </div>
      <span className='text-[9px]'>{t('shortcuts.zoom')}</span>

      <div className='flex items-center gap-1'>
        <kbd className='luxury-border luxury-shadow-subtle bg-muted rounded-sm px-1.5 py-0.5 font-mono text-[9px]'>
          {t('shortcuts.ctrl')}
        </kbd>
        <span className='text-[9px]'>{t('shortcuts.plus')}</span>
        <kbd className='luxury-border luxury-shadow-subtle bg-muted rounded-sm px-1.5 py-0.5 font-mono text-[9px]'>
          {t('shortcuts.drag')}
        </kbd>
      </div>
      <span className='text-[9px]'>{t('shortcuts.pan')}</span>

      <div className='flex items-center gap-1'>
        <kbd className='luxury-border luxury-shadow-subtle bg-muted rounded-sm px-1.5 py-0.5 font-mono text-[9px]'>
          Del
        </kbd>
      </div>
      <span className='text-[9px]'>{t('shortcuts.delete')}</span>
    </div>
  )
}
