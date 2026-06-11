import { cn } from '@/lib/utils'

const statusColor: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-800',
  PUBLISHED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  FAILED: 'bg-red-100 text-red-800',
  PENDING: 'bg-amber-100 text-amber-800',
  PAYMENT_PENDING: 'bg-amber-100 text-amber-800',
  WAITING: 'bg-slate-100 text-slate-700',
  INACTIVE: 'bg-stone-200 text-stone-700',
}

function formatBadgeLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function Badge({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-1 text-[11px] font-medium',
        statusColor[children] ?? 'bg-slate-100 text-slate-700',
        className,
      )}
    >
      {formatBadgeLabel(children)}
    </span>
  )
}
