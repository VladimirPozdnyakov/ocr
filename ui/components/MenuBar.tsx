'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { fitCanvasToViewport, resetCanvasScale } from '@/components/Canvas'
import Image from 'next/image'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { useDocumentMutations } from '@/lib/query/mutations'

type MenuItem = {
  label: string
  onSelect?: () => void | Promise<void>
  disabled?: boolean
  testId?: string
}

type MenuSection = {
  label: string
  items: MenuItem[]
  triggerTestId?: string
}

export function MenuBar() {
  const { t } = useTranslation()
  const {
    addDocuments,
    openDocuments,
    openFolder,
    addFolder,
    openExternal,
    processImage,
    processAllImages,
    exportDocument,
  } = useDocumentMutations()

  const fileMenuItems: MenuItem[] = [
    {
      label: t('menu.openFile'),
      onSelect: openDocuments,
      testId: 'menu-file-open',
    },
    {
      label: t('menu.addFile'),
      onSelect: addDocuments,
      testId: 'menu-file-add',
    },
    {
      label: t('menu.openFolder'),
      onSelect: openFolder,
      testId: 'menu-file-open-folder',
    },
    {
      label: t('menu.addFolder'),
      onSelect: addFolder,
      testId: 'menu-file-add-folder',
    },
    {
      label: t('menu.export'),
      onSelect: exportDocument,
      testId: 'menu-file-export',
    },
  ]

  const menus: MenuSection[] = [
    {
      label: t('menu.view'),
      items: [
        { label: t('menu.fitWindow'), onSelect: fitCanvasToViewport },
        { label: t('menu.originalSize'), onSelect: resetCanvasScale },
      ],
    },
    {
      label: t('menu.process'),
      triggerTestId: 'menu-process-trigger',
      items: [
        {
          label: t('menu.processCurrent'),
          onSelect: processImage,
          testId: 'menu-process-current',
        },
        {
          label: t('menu.processAll'),
          onSelect: processAllImages,
          testId: 'menu-process-all',
        },
      ],
    },
  ]

  const helpMenuItems: MenuItem[] = [
    {
      label: t('menu.telegram'),
      onSelect: () => openExternal('https://t.me/+yq6z7BZcZ84xODJi'),
    },
    {
      label: t('menu.github'),
      onSelect: () => openExternal('https://github.com/VladimirPozdnyakov/ocr'),
    },
  ]

  return (
    <div className='luxury-border luxury-shadow border-border bg-background text-foreground flex h-9 items-center border-b text-[13px]'>
      {/* Logo */}
      <div className='flex h-full items-center pl-3 select-none'>
        <div className='hover:luxury-scale-subtle flex size-6 items-center justify-center rounded-sm transition-all duration-300'>
          <Image
            src='/logo.jpg'
            alt='Lilith Team'
            width={20}
            height={20}
            draggable={false}
            className='rounded-sm'
          />
        </div>
      </div>

      {/* Menu items */}
      <Menubar className='h-auto gap-2 border-none bg-transparent p-0 px-2 shadow-none'>
        <MenubarMenu>
          <MenubarTrigger
            data-testid='menu-file-trigger'
            className='hover:bg-luxury-gold hover:text-background data-[state=open]:bg-luxury-gold data-[state=open]:text-background font-inter rounded-sm px-4 py-1.5 font-medium tracking-wide transition-all duration-200'
          >
            {t('menu.file')}
          </MenubarTrigger>
          <MenubarContent
            className='min-w-36'
            align='start'
            sideOffset={5}
            alignOffset={-3}
          >
            {fileMenuItems.map((item) => (
              <MenubarItem
                key={item.label}
                data-testid={item.testId}
                className='text-[13px]'
                disabled={item.disabled}
                onSelect={
                  item.onSelect
                    ? () => {
                        void item.onSelect?.()
                      }
                    : undefined
                }
              >
                {item.label}
              </MenubarItem>
            ))}
          </MenubarContent>
        </MenubarMenu>
        {menus.map(({ label, items, triggerTestId }) => (
          <MenubarMenu key={label}>
            <MenubarTrigger
              data-testid={triggerTestId}
              className='hover:bg-luxury-gold hover:text-background data-[state=open]:bg-luxury-gold data-[state=open]:text-background font-inter rounded-sm px-4 py-1.5 font-medium tracking-wide transition-all duration-200'
            >
              {label}
            </MenubarTrigger>
            <MenubarContent
              className='min-w-36'
              align='start'
              sideOffset={5}
              alignOffset={-3}
            >
              {items.map((item) => (
                <MenubarItem
                  key={item.label}
                  data-testid={item.testId}
                  className='text-[13px]'
                  disabled={item.disabled}
                  onSelect={
                    item.onSelect
                      ? () => {
                          void item.onSelect?.()
                        }
                      : undefined
                  }
                >
                  {item.label}
                </MenubarItem>
              ))}
            </MenubarContent>
          </MenubarMenu>
        ))}
        <MenubarMenu>
          <MenubarTrigger className='hover:bg-luxury-gold hover:text-background data-[state=open]:bg-luxury-gold data-[state=open]:text-background font-inter rounded-sm px-4 py-1.5 font-medium tracking-wide transition-all duration-200'>
            {t('menu.help')}
          </MenubarTrigger>
          <MenubarContent
            className='min-w-36'
            align='start'
            sideOffset={5}
            alignOffset={-3}
          >
            {helpMenuItems.map((item) => (
              <MenubarItem
                key={item.label}
                className='text-[13px]'
                disabled={item.disabled}
                onSelect={
                  item.onSelect
                    ? () => {
                        void item.onSelect?.()
                      }
                    : undefined
                }
              >
                {item.label}
              </MenubarItem>
            ))}
            <MenubarSeparator />
            <MenubarItem className='text-[13px]' asChild>
              <Link href='/settings' prefetch={false}>
                {t('menu.settings')}
              </Link>
            </MenubarItem>
            <MenubarItem className='text-[13px]' asChild>
              <Link href='/about' prefetch={false}>
                {t('settings.about')}
              </Link>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* Spacer */}
      <div className='flex h-full flex-1 items-center justify-center' />
    </div>
  )
}
