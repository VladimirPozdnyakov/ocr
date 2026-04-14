'use client'

import { MenuBar } from '@/components/MenuBar'
import { ToastContainer } from '@/components/ui/toast'
import { useToastStore } from '@/hooks/useToast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className='bg-background flex h-screen w-screen flex-col overflow-hidden'>
      <MenuBar />
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
