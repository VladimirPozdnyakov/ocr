'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import {
  ChevronLeftIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  GitForkIcon,
  UserIcon,
  GithubIcon,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/lib/api'
import { useDocumentMutations } from '@/lib/query/mutations'
import Image from 'next/image'

const ORIGINAL_REPO = 'mayocream/koharu'
const FORK_REPO = 'VladimirPozdnyakov/ocr'

type VersionStatus = 'loading' | 'latest' | 'outdated' | 'error'

export default function AboutPage() {
  const { t } = useTranslation()
  const { openExternal } = useDocumentMutations()

  const [appVersion, setAppVersion] = useState<string>()
  const [latestVersion, setLatestVersion] = useState<string>()
  const [versionStatus, setVersionStatus] = useState<VersionStatus>('loading')

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const version = await api.appVersion()
        setAppVersion(version)

        const res = await fetch(
          `https://api.github.com/repos/${FORK_REPO}/releases/latest`,
        )
        if (res.ok) {
          const data = await res.json()
          const latest = data.tag_name?.replace(/^v/, '') || data.name
          setLatestVersion(latest)
          setVersionStatus(version === latest ? 'latest' : 'outdated')
        } else {
          setVersionStatus('error')
        }
      } catch {
        setVersionStatus('error')
      }
    }

    void checkVersion()
  }, [])

  return (
    <div className='bg-muted flex flex-1 flex-col overflow-hidden'>
      <ScrollArea className='flex-1'>
        <div className='px-4 py-6'>
          <div className='relative mx-auto max-w-xl'>
            {/* Header with back button */}
            <div className='mb-8 flex items-center'>
              <Link
                href='/'
                prefetch={false}
                className='text-muted-foreground hover:bg-accent hover:text-foreground absolute -left-14 flex size-10 items-center justify-center rounded-full transition'
              >
                <ChevronLeftIcon className='size-6' />
              </Link>
              <h1 className='text-foreground text-2xl font-bold'>
                {t('settings.about')}
              </h1>
            </div>

            {/* App Info */}
            <div className='mb-8 flex flex-col items-center text-center'>
              <Image
                src='/icon-large.jpg'
                alt='Lilith Team'
                width={96}
                height={96}
                className='mb-4 rounded-lg'
                draggable={false}
              />
              <h2 className='text-foreground mb-1 text-xl font-bold'>
                Koharu (Lilith Team Edition)
              </h2>
              <p className='text-muted-foreground text-sm'>
                Форк Koharu для команды переводчиков манги Lilith Team
              </p>
            </div>

            {/* Version & Info Card */}
            <div className='bg-card border-border mb-4 rounded-lg border p-4'>
              <div className='space-y-3 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>
                    {t('settings.aboutVersion')}
                  </span>
                  <div className='flex items-center gap-2'>
                    <span className='text-foreground font-medium'>
                      {appVersion || '...'}
                    </span>
                    {versionStatus === 'loading' && (
                      <LoaderIcon className='text-muted-foreground size-4 animate-spin' />
                    )}
                    {versionStatus === 'latest' && (
                      <span className='flex items-center gap-1 text-xs text-green-500'>
                        <CheckCircleIcon className='size-3.5' />
                        {t('settings.aboutLatest')}
                      </span>
                    )}
                    {versionStatus === 'outdated' && (
                      <button
                        onClick={() =>
                          openExternal(
                            `https://github.com/${FORK_REPO}/releases/latest`,
                          )
                        }
                        className='flex items-center gap-1 text-xs text-amber-500 hover:underline'
                      >
                        <AlertCircleIcon className='size-3.5' />
                        {t('settings.aboutUpdate', { version: latestVersion })}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fork Info Card */}
            <div className='bg-card border-border rounded-lg border p-4'>
              <div className='mb-3 flex items-center gap-2'>
                <GitForkIcon className='text-luxury-gold size-4' />
                <span className='text-foreground text-sm font-semibold'>
                  Информация о форке
                </span>
              </div>
              <div className='space-y-3 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground flex items-center gap-2'>
                    <UserIcon className='size-3.5' />
                    Автор форка
                  </span>
                  <button
                    onClick={() =>
                      openExternal('https://github.com/VladimirPozdnyakov')
                    }
                    className='text-foreground font-medium hover:underline'
                  >
                    VladimirPozdnyakov
                  </button>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground flex items-center gap-2'>
                    <GithubIcon className='size-3.5' />
                    Репозиторий форка
                  </span>
                  <button
                    onClick={() =>
                      openExternal(`https://github.com/${FORK_REPO}`)
                    }
                    className='text-foreground font-medium hover:underline'
                  >
                    VladimirPozdnyakov/ocr
                  </button>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground flex items-center gap-2'>
                    <GithubIcon className='size-3.5' />
                    Репозиторий оригинала
                  </span>
                  <button
                    onClick={() =>
                      openExternal(`https://github.com/${ORIGINAL_REPO}`)
                    }
                    className='text-foreground font-medium hover:underline'
                  >
                    Mayo/koharu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
