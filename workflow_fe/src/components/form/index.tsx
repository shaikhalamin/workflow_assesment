import * as React from 'react'

import { cn } from '@/lib/utils'

type FormFieldProps = {
  label: string
  htmlFor?: string
  description?: string
  error?: string
  children: React.ReactNode
}

export function FormField({
  label,
  htmlFor,
  description,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]"
      >
        {label}
      </label>
      {children}
      {description ? (
        <p className="text-xs leading-5 text-[var(--muted-foreground)]">
          {description}
        </p>
      ) : null}
      {error ? <p className="text-xs text-[var(--destructive)]">{error}</p> : null}
    </div>
  )
}

export function FormInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-md border border-[var(--input)] bg-white px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--muted-foreground)]',
        className,
      )}
      {...props}
    />
  )
}

export function FormSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-9 w-full rounded-md border border-[var(--input)] bg-white px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--muted-foreground)]',
        className,
      )}
      {...props}
    />
  )
}

export function FormTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-md border border-[var(--input)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20 disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--muted-foreground)]',
        className,
      )}
      {...props}
    />
  )
}

type FormCheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label: string
  description?: string
}

export function FormCheckbox({
  label,
  description,
  className,
  ...props
}: FormCheckboxProps) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-[var(--ink-2)]">
      <input
        type="checkbox"
        className={cn('mt-0.5 h-4 w-4 accent-[var(--primary)]', className)}
        {...props}
      />
      <span>
        <span className="block font-medium">{label}</span>
        {description ? (
          <span className="block text-xs leading-5 text-[var(--muted-foreground)]">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  )
}

type FormSectionProps = {
  index: string
  title: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  index,
  title,
  hint,
  children,
  className,
}: FormSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-end gap-2">
        <span className="font-mono text-[11px] text-[var(--ink-3)]">{index}</span>
        <h2 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h2>
        {hint ? (
          <span className="text-[11px] text-[var(--muted-foreground)]">
            {hint}
          </span>
        ) : null}
      </div>
      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        {children}
      </div>
    </section>
  )
}

type FormShellProps = {
  kicker: string
  title: string
  description?: string
  navigation?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  aside?: React.ReactNode
}

export function FormShell({
  kicker,
  title,
  description,
  navigation,
  actions,
  children,
  aside,
}: FormShellProps) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-start gap-3">
          {navigation}
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
              {kicker}
            </p>
            <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[26px]">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions}
      </header>
      <div className={aside ? 'grid gap-6 lg:grid-cols-[1fr_320px]' : ''}>
        <div className="space-y-6">{children}</div>
        {aside ? <aside className="space-y-3">{aside}</aside> : null}
      </div>
    </div>
  )
}
