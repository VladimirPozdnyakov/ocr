'use client'

import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type ToastProps = {
  message: string
  type?: 'info' | 'error' | 'success'
  onClose?: () => void
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const { t } = useTranslation()
  const icons = {
    info: { Icon: Info, className: 'text-luxury-gold' },
    error: { Icon: AlertCircle, className: 'text-luxury-rose' },
    success: { Icon: CheckCircle2, className: 'text-luxury-sage' },
  }

  const { Icon, className } = icons[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`luxury-border luxury-shadow flex max-w-md items-center gap-3 rounded-sm px-4 py-3 shadow-lg ${
        type === 'error'
          ? 'bg-luxury-rose/10'
          : type === 'success'
            ? 'bg-luxury-sage/10'
            : 'bg-luxury-gold/10'
      }`}
      role='alert'
      aria-live='polite'
    >
      <Icon className={`size-5 flex-shrink-0 ${className}`} aria-hidden='true' />
      <p className='flex-1 font-inter text-sm text-foreground'>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className='text-muted-foreground hover:text-foreground transition-colors'
          aria-label={t('aria.closeNotification')}
        >
          <X className='size-4' />
        </button>
      )}
    </motion.div>
  )
}

type ToastContainerProps = {
  toasts: Array<{ id: string; message: string; type?: 'info' | 'error' | 'success' }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className='fixed bottom-4 right-4 z-[110] flex flex-col gap-2'>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
