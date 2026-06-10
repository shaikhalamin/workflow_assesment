import * as React from 'react'

import { cn } from '@/lib/utils'

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-sm font-medium text-[var(--foreground)]', className)}
      {...props}
    />
  )
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-[var(--input)] bg-white px-3 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--ring)]',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-md border border-[var(--input)] bg-white px-3 py-2 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--ring)]',
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-md border border-[var(--input)] bg-white px-3 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--ring)]',
        className,
      )}
      {...props}
    />
  )
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return <p className="text-xs text-[var(--destructive)]">{children}</p>
}
