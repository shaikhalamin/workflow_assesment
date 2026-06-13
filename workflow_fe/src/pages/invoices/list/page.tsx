import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import {
CheckCircle2,
Download,
Eye,
XCircle
} from 'lucide-react'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/features/auth/auth-routing'
import {
InvoiceDownloadLink
} from '@/features/invoices/invoice-pdf'
import { useInvoicesControllerCancel,useInvoicesControllerList,useInvoicesControllerMarkPaid } from '@/lib/api/gen'
import {
unwrapData
} from '@/lib/format'
import {
ErrorNotice,
PageHeader
} from '@/pages/utils/page-components'
import {
invoicePdfDataFromUnknown,
moneyLabel,
type Row
} from '@/pages/utils/page-helpers'
import { useAuthStore } from '@/stores/auth-store'

export function InvoicesPage() {
  const user = useAuthStore((state) => state.user)
  const query = useInvoicesControllerList({ params: { page: 1, limit: 50 } })
  const markPaid = useInvoicesControllerMarkPaid({ mutation: { onSuccess: () => void query.refetch() } })
  const cancel = useInvoicesControllerCancel({ mutation: { onSuccess: () => void query.refetch() } })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  const canWriteInvoices = hasPermission(
    user?.roles ?? [],
    user?.permissions ?? [],
    'invoices.write',
  )
  const columns: ColumnDef<Row>[] = [
    { header: 'Invoice', accessorKey: 'invoiceNumber' },
    { header: 'Title', accessorKey: 'title' },
    { header: 'Customer', accessorKey: 'customerName' },
    { header: 'Amount', cell: ({ row }) => moneyLabel(row.original.amount, row.original.currency) },
    { header: 'Due date', accessorKey: 'dueDate' },
    { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const id = String(row.original.id)
        const status = String(row.original.status)
        const invoice = invoicePdfDataFromUnknown(row.original)

        return (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
              to="/invoices/$invoiceId"
              params={{ invoiceId: id }}
            >
              <Eye className="h-4 w-4" />
              Open
            </Link>
            {invoice ? (
              <InvoiceDownloadLink
                invoice={invoice}
                className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
              >
                <Download className="h-4 w-4" />
                Download invoice
              </InvoiceDownloadLink>
            ) : null}
            {canWriteInvoices && status === 'ISSUED' ? (
              <>
                <Button size="sm" type="button" onClick={() => markPaid.mutate({ id })}>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark paid
                </Button>
                <Button size="sm" type="button" variant="destructive" onClick={() => cancel.mutate({ id })}>
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : null}
          </div>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader title="Invoices" kicker="Finance" />
      <ErrorNotice error={query.error ?? markPaid.error ?? cancel.error} />
      <DataTable data={rows} columns={columns} />
    </>
  )
}
