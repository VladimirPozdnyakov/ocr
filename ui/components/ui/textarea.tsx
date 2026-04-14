import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'border-input placeholder:text-muted-foreground hover:border-luxury-gold/40 focus-visible:border-luxury-gold focus-visible:ring-luxury-gold focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 bg-card luxury-shadow-subtle font-inter flex min-h-20 w-full resize-y rounded-sm border px-4 py-3 text-base transition-all duration-150 outline-none hover:shadow-sm focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
