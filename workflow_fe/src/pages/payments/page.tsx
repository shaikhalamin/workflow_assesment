import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/features/auth/auth-routing'
import { usePaymentsControllerList,usePaymentsControllerMarkPaid } from '@/lib/api/gen'
import {
formatValue,
unwrapData
} from '@/lib/format'
import {
ErrorNotice,
PageHeader
} from '@/pages/utils/page-components'
import {
type Row
} from '@/pages/utils/page-helpers'
import { useAuthStore } from '@/stores/auth-store'

export function PaymentsPage() {
  const user = useAuthStore((state) => state.user)
  const query = usePaymentsControllerList({ params: { page: 1, limit: 50 } })
  const markPaid = usePaymentsControllerMarkPaid({ mutation: { onSuccess: () => void query.refetch() } })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  const canWritePayments = hasPermission(
    user?.roles ?? [],
    user?.permissions ?? [],
    'payments.write',
  )
  const columns: ColumnDef<Row>[] = [
    { header: 'Payment', accessorKey: 'id' },
    { header: 'Expense', accessorKey: 'expenseId' },
    { header: 'Amount', cell: ({ row }) => `${formatValue(row.original.amount)} ${formatValue(row.original.currency)}` },
    { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
  ]

  if (canWritePayments) {
    columns.push({
      header: 'Action',
      cell: ({ row }) => {
        const isPaid = String(row.original.status).toUpperCase() === 'PAID'

        return (
          <Button
            size="sm"
            type="button"
            disabled={isPaid}
            onClick={() => markPaid.mutate({ id: String(row.original.id), data: { paymentReference: `MANUAL-${Date.now()}` } })}
          >
            Mark paid
          </Button>
        )
      },
    })
  }

  return (
    <>
      <PageHeader title="Payment requests" kicker="Accounts" />
      <ErrorNotice error={query.error} />
      <DataTable
        data={rows}
        columns={columns}
      />
    </>
  )
}
