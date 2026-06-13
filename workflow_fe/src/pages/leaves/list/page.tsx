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
import { useLeavesControllerDelete,useLeavesControllerList,useLeavesControllerSubmit } from '@/lib/api/gen'
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

export function LeavesPage() {
  const user = useAuthStore((state) => state.user)
  const query = useLeavesControllerList({ params: { page: 1, limit: 50 } })
  const submit = useLeavesControllerSubmit({ mutation: { onSuccess: () => void query.refetch() } })
  const deleteLeave = useLeavesControllerDelete({ mutation: { onSuccess: () => void query.refetch() } })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  const canWriteLeaves = hasPermission(
    user?.roles ?? [],
    user?.permissions ?? [],
    'leaves.write',
  )
  return (
    <>
      <PageHeader
        title="Leaves"
        kicker="Requests"
        action={
          canWriteLeaves ? (
            <Button type="button">
              <Link to="/leaves/new" className="inline-flex items-center gap-2"><FilePlus2 className="h-4 w-4" /> New leave</Link>
            </Button>
          ) : undefined
        }
      />
      <ErrorNotice error={query.error ?? submit.error ?? deleteLeave.error} />
      <DataTable
        data={rows}
        empty={
          canWriteLeaves ? (
            <Button type="button">
              <Link to="/leaves/new" className="inline-flex items-center gap-2">
                <FilePlus2 className="h-4 w-4" />
                New Leave Request
              </Link>
            </Button>
          ) : (
            'No records found.'
          )
        }
        columns={[
          { header: 'Type', accessorKey: 'leaveType' },
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
          { header: 'Days', accessorKey: 'leaveDays' },
          { header: 'Period', cell: ({ row }) => `${formatValue(row.original.startDate)} - ${formatValue(row.original.endDate)}` },
          { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
          {
            header: 'Actions',
            cell: ({ row }) => {
              const status = String(row.original.status)
              const canResubmit = row.original.canResubmit === true

              return (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
                    to="/leaves/$leaveId"
                    params={{ leaveId: String(row.original.id) }}
                  >
                    <Eye className="h-4 w-4" />
                    Open
                  </Link>
                  {canWriteLeaves && status === 'DRAFT' ? (
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
                  {canWriteLeaves && status === 'REJECTED' && canResubmit ? (
                    <Link
                      className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-emerald-600 bg-emerald-600 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700"
                      to="/leaves/$leaveId/edit"
                      params={{ leaveId: String(row.original.id) }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit and resubmit
                    </Link>
                  ) : null}
                  {canWriteLeaves && status !== 'DRAFT' && !(status === 'REJECTED' && canResubmit) ? (
                    <Button className="whitespace-nowrap" disabled size="sm" type="button" variant="secondary">
                      Submitted
                    </Button>
                  ) : null}
                  {canWriteLeaves && status === 'DRAFT' ? (
                    <Button
                      className="whitespace-nowrap"
                      disabled={deleteLeave.isPending}
                      size="sm"
                      type="button"
                      variant="destructive"
                      onClick={() => deleteLeave.mutate({ id: String(row.original.id) })}
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
