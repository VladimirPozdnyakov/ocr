import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:scale-[1.02] active:scale-[0.98] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 luxury-shadow hover:shadow-md',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 luxury-shadow hover:shadow-md',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:shadow-sm dark:bg-input/30 dark:border-input dark:hover:bg-input/50 luxury-border-subtle',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 luxury-shadow hover:shadow-md',
        ghost:
          'hover:bg-accent hover:text-accent-foreground hover:shadow-sm dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline decoration-luxury-gold decoration-1 underline',
      },
      size: {
        default: 'h-9 px-5 py-2 has-[>svg]:px-4',
        xs: "h-6 gap-1 rounded-sm px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 rounded-sm gap-1.5 px-4 has-[>svg]:px-3',
        lg: 'h-10 rounded-sm px-7 has-[>svg]:px-5',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot='button'
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
