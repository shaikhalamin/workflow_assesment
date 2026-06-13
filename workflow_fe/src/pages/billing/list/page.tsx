import { Link } from '@tanstack/react-router'
import {
Eye,
FilePlus2,
Pencil,
Send,
XCircle
} from 'lucide-react'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/features/auth/auth-routing'
import { useBillingControllerCancel,useBillingControllerList,useBillingControllerSubmit } from '@/lib/api/gen'
import {
formatValue,
unwrapData
} from '@/lib/format'
import {
ErrorNotice,
PageHeader
} from '@/pages/utils/page-components'
import {
describeUserReference,
moneyLabel,
type Row
} from '@/pages/utils/page-helpers'
import { useAuthStore } from '@/stores/auth-store'

export function BillingRequestsPage() {
  const user = useAuthStore((state) => state.user)
  const query = useBillingControllerList({ params: { page: 1, limit: 50 } })
  const submit = useBillingControllerSubmit({ mutation: { onSuccess: () => void query.refetch() } })
  const cancel = useBillingControllerCancel({ mutation: { onSuccess: () => void query.refetch() } })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  const canWriteBilling = hasPermission(
    user?.roles ?? [],
    user?.permissions ?? [],
    'billing.write',
  )

  return (
    <>
      <PageHeader
        title="Billing"
        kicker="Requests"
        action={
          canWriteBilling ? (
            <Button type="button">
              <Link to="/billing/new" className="inline-flex items-center gap-2">
                <FilePlus2 className="h-4 w-4" /> New billing
              </Link>
            </Button>
          ) : undefined
        }
      />
      <ErrorNotice error={query.error ?? submit.error ?? cancel.error} />
      <DataTable
        data={rows}
        empty={
          canWriteBilling ? (
            <Button type="button">
              <Link to="/billing/new" className="inline-flex items-center gap-2">
                <FilePlus2 className="h-4 w-4" />
                New Billing Request
              </Link>
            </Button>
          ) : (
            'No records found.'
          )
        }
        columns={[
          { header: 'Title', accessorKey: 'title' },
          { header: 'Customer', accessorKey: 'customerName' },
          {
            header: 'Request created by',
            cell: ({ row }) =>
              formatValue(
                describeUserReference(
                  [],
                  row.original.createdBy ?? row.original.createdById,
                ),
              ),
          },
          { header: 'Amount', cell: ({ row }) => moneyLabel(row.original.amount, row.original.currency) },
          { header: 'Category', accessorKey: 'billingCategory' },
          { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
          {
            header: 'Actions',
            cell: ({ row }) => {
              const status = String(row.original.status)
              const canResubmit = row.original.canResubmit === true
              const id = String(row.original.id)

              return (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
                    to="/billing/$billingId"
                    params={{ billingId: id }}
                  >
                    <Eye className="h-4 w-4" />
                    Open
                  </Link>
                  {canWriteBilling && status === 'DRAFT' ? (
                    <Button
                      className="whitespace-nowrap border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={submit.isPending}
                      size="sm"
                      type="button"
                      onClick={() => submit.mutate({ id })}
                    >
                      <Send className="h-4 w-4" />
                      Submit
                    </Button>
                  ) : null}
                  {canWriteBilling && status === 'REJECTED' && canResubmit ? (
                    <Link
                      className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-emerald-600 bg-emerald-600 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700"
                      to="/billing/$billingId/edit"
                      params={{ billingId: id }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit and resubmit
                    </Link>
                  ) : null}
                  {canWriteBilling && !['DRAFT', 'REJECTED'].includes(status) ? (
                    <Button className="whitespace-nowrap" disabled size="sm" type="button" variant="secondary">
                      Submitted
                    </Button>
                  ) : null}
                  {canWriteBilling && status === 'DRAFT' ? (
                    <Button
                      className="whitespace-nowrap"
                      disabled={cancel.isPending}
                      size="sm"
                      type="button"
                      variant="destructive"
                      onClick={() => cancel.mutate({ id })}
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </Button>
                  ) : null}
                </div>
              )
            },
          },
        ]}
      />
    </>
  )
}
