import * as React from 'react'

import { cn } from '@/lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'icon'
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border font-medium transition disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'icon' && 'h-9 w-9 p-0',
        variant === 'primary' &&
          'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:bg-[#155996]',
        variant === 'secondary' &&
          'border-[var(--border)] bg-white text-[var(--secondary-foreground)] shadow-sm hover:bg-[var(--surface-2)]',
        variant === 'ghost' &&
          'border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-2)]',
        variant === 'destructive' &&
          'border-[var(--destructive)] bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[#931d14]',
        className,
      )}
      {...props}
    />
  )
}
