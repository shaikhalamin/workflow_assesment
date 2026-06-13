import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import {
CheckCircle2,
Eye,
XCircle
} from 'lucide-react'
import { useState } from 'react'

import { DataTable } from '@/components/data-table'
import {
FormInput
} from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
WorkflowStepResponseDto
} from '@/lib/api/gen'
import { useWorkflowRuntimeControllerApprove,useWorkflowRuntimeControllerMyPending,useWorkflowRuntimeControllerReject } from '@/lib/api/gen'
import {
formatDate,
unwrapData
} from '@/lib/format'
import {
ErrorNotice,
PageHeader
} from '@/pages/utils/page-components'
import {
requestAmountOrDaysLabel,
requesterLabel,
requestSummaryFromRow,
type Row
} from '@/pages/utils/page-helpers'

export function TasksPage() {
  const query = useWorkflowRuntimeControllerMyPending()
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  return (
    <>
      <PageHeader title="Pending approvals" kicker="Approvals" description="Approve or reject active workflow steps assigned to your user or role." />
      <ErrorNotice error={query.error} />
      <TaskTable rows={rows} withActions />
    </>
  )
}

function TaskTable({
  rows,
  withActions = false,
}: {
  rows: Array<Row | WorkflowStepResponseDto>
  withActions?: boolean
}) {
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')
  const approve = useWorkflowRuntimeControllerApprove({ mutation: { onSuccess: () => void queryClient.invalidateQueries() } })
  const reject = useWorkflowRuntimeControllerReject({ mutation: { onSuccess: () => void queryClient.invalidateQueries() } })
  const columns: ColumnDef<Row | WorkflowStepResponseDto>[] = [
    {
      header: 'Request',
      cell: ({ row }) => {
        const request = requestSummaryFromRow(row.original)
        return request?.title ?? '-'
      },
    },
    {
      header: 'Request type',
      cell: ({ row }) => {
        const request = requestSummaryFromRow(row.original)
        return request?.type ?? '-'
      },
    },
    {
      header: 'Requested by',
      cell: ({ row }) => requesterLabel(requestSummaryFromRow(row.original)),
    },
    {
      header: 'Amount / Days',
      cell: ({ row }) =>
        requestAmountOrDaysLabel(requestSummaryFromRow(row.original)),
    },
    { header: 'Step type', accessorKey: 'stepType' },
    { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
    {
      header: 'Activated',
      cell: ({ row }) => formatDate(row.original.activatedAt),
    },
    {
      header: 'Details',
      cell: ({ row }) => {
        const workflowInstanceId =
          'workflowInstanceId' in row.original
            ? row.original.workflowInstanceId
            : undefined

        return workflowInstanceId ? (
          <Link
            className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
            to="/workflow-instances/$instanceId"
            params={{ instanceId: String(workflowInstanceId) }}
          >
            <Eye className="h-4 w-4" />
            View details
          </Link>
        ) : (
          '-'
        )
      },
    },
  ]
  if (withActions) {
    columns.push({
      header: 'Decision',
      cell: ({ row }) => (
        <div className="flex min-w-72 flex-col gap-2">
          <FormInput placeholder="Comment or rejection reason" value={comment} onChange={(event) => setComment(event.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" type="button" onClick={() => approve.mutate({ id: String(row.original.id), data: { comment } })}>
              <CheckCircle2 className="h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="destructive" type="button" onClick={() => reject.mutate({ id: String(row.original.id), data: { reason: comment } })}>
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          </div>
        </div>
      ),
    })
  }
  return <DataTable columns={columns} data={rows} />
}
