import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-luxury-gold focus-visible:ring-luxury-gold/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-20 w-full rounded-sm border bg-card px-4 py-3 text-base luxury-shadow-subtle transition-all duration-200 outline-none focus-visible:ring-[2px] disabled:cursor-not-allowed disabled:opacity-50 resize-none md:text-sm  font-inter',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
