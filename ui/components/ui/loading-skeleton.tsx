'use client'

import { cn } from '@/lib/utils'

export function LoadingSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse bg-muted/20 rounded-sm', className)}
      {...props}
    />
  )
}

export function PanelLoadingSkeleton() {
  return (
    <div className='flex h-full flex-col gap-3 p-4'>
      <LoadingSkeleton className='h-8 w-3/4' />
      <LoadingSkeleton className='h-4 w-1/2' />
      <LoadingSkeleton className='h-4 w-5/6' />
      <LoadingSkeleton className='h-32 w-full' />
    </div>
  )
}

export function CanvasLoadingSkeleton() {
  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center gap-4 border-b px-4 py-3'>
        <LoadingSkeleton className='h-8 w-24' />
        <LoadingSkeleton className='h-8 w-24' />
      </div>
      <div className='flex-1 bg-muted/10' />
      <div className='border-t px-4 py-2'>
        <LoadingSkeleton className='h-4 w-48' />
      </div>
    </div>
  )
}

export function NavigatorLoadingSkeleton() {
  return (
    <div className='flex h-full flex-col gap-2 p-2'>
      <LoadingSkeleton className='h-12 w-full' />
      <LoadingSkeleton className='h-12 w-full' />
      <LoadingSkeleton className='h-12 w-full' />
      <LoadingSkeleton className='h-12 w-full' />
    </div>
  )
}
