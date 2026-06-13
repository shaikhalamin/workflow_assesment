import { Link } from '@tanstack/react-router'
import {
Eye,
FilePlus2,
Pencil,
Send,
Trash2
} from 'lucide-react'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/features/auth/auth-routing'
import { useExpensesControllerDelete,useExpensesControllerList,useExpensesControllerSubmit } from '@/lib/api/gen'
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
type Row
} from '@/pages/utils/page-helpers'
import { useAuthStore } from '@/stores/auth-store'

export function ExpensesPage() {
  const user = useAuthStore((state) => state.user)
  const query = useExpensesControllerList({ params: { page: 1, limit: 50 } })
  const submit = useExpensesControllerSubmit({ mutation: { onSuccess: () => void query.refetch() } })
  const deleteExpense = useExpensesControllerDelete({ mutation: { onSuccess: () => void query.refetch() } })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  const canWriteExpenses = hasPermission(
    user?.roles ?? [],
    user?.permissions ?? [],
    'expenses.write',
  )
  return (
    <>
      <PageHeader
        title="Expenses"
        kicker="Requests"
        action={
          canWriteExpenses ? (
            <Button type="button">
              <Link to="/expenses/new" className="inline-flex items-center gap-2"><FilePlus2 className="h-4 w-4" /> New expense</Link>
            </Button>
          ) : undefined
        }
      />
      <ErrorNotice error={query.error ?? submit.error ?? deleteExpense.error} />
      <DataTable
        data={rows}
        empty={
          canWriteExpenses ? (
            <Button type="button">
              <Link to="/expenses/new" className="inline-flex items-center gap-2">
                <FilePlus2 className="h-4 w-4" />
                New Expense Request
              </Link>
            </Button>
          ) : (
            'No records found.'
          )
        }
        columns={[
          { header: 'Title', accessorKey: 'title' },
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
          { header: 'Amount', cell: ({ row }) => `${formatValue(row.original.amount)} ${formatValue(row.original.currency)}` },
          { header: 'Category', accessorKey: 'category' },
          { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
          {
            header: 'Actions',
            cell: ({ row }) => {
              const status = String(row.original.status)
              const canResubmit = row.original.canResubmit === true
              const isRequester = row.original.requesterId === user?.id

              return (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
                    to="/expenses/$expenseId"
                    params={{ expenseId: String(row.original.id) }}
                  >
                    <Eye className="h-4 w-4" />
                    Open
                  </Link>
                  {canWriteExpenses && isRequester && status === 'DRAFT' ? (
                    <Button
                      className="whitespace-nowrap border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={submit.isPending}
                      size="sm"
                      type="button"
                      onClick={() => submit.mutate({ id: String(row.original.id) })}
                    >
                      <Send className="h-4 w-4" />
                      Submit
                    </Button>
                  ) : null}
                  {canWriteExpenses && isRequester && status === 'REJECTED' && canResubmit ? (
                    <Link
                      className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-emerald-600 bg-emerald-600 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700"
                      to="/expenses/$expenseId/edit"
                      params={{ expenseId: String(row.original.id) }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit and resubmit
                    </Link>
                  ) : null}
                  {canWriteExpenses && status !== 'DRAFT' && !(status === 'REJECTED' && canResubmit) ? (
                    <Button className="whitespace-nowrap" disabled size="sm" type="button" variant="secondary">
                      Submitted
                    </Button>
                  ) : null}
                  {canWriteExpenses && isRequester && status === 'DRAFT' ? (
                    <Button
                      className="whitespace-nowrap"
                      disabled={deleteExpense.isPending}
                      size="sm"
                      type="button"
                      variant="destructive"
                      onClick={() => deleteExpense.mutate({ id: String(row.original.id) })}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
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
