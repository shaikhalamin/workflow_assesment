import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import {
Eye,
PlayCircle,
Plus,
XCircle
} from 'lucide-react'
import { useMemo } from 'react'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWorkflowTemplateControllerDeactivate,useWorkflowTemplateControllerList,useWorkflowTemplateControllerPublish } from '@/lib/api/gen'
import {
rowsFrom
} from '@/lib/format'
import {
ErrorNotice,
PageHeader
} from '@/pages/utils/page-components'
import {
type Row
} from '@/pages/utils/page-helpers'

export function WorkflowTemplatesPage() {
  const query = useWorkflowTemplateControllerList({ params: { page: 1, limit: 100 } })
  const publish = useWorkflowTemplateControllerPublish({
    mutation: { onSuccess: () => void query.refetch() },
  })
  const deactivate = useWorkflowTemplateControllerDeactivate({
    mutation: { onSuccess: () => void query.refetch() },
  })
  const rows = rowsFrom(query.data)
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { header: 'Name', accessorKey: 'name' },
      { header: 'Module', accessorKey: 'moduleName' },
      { header: 'Event', accessorKey: 'eventName' },
      {
        header: 'Status',
        cell: ({ row }) => <Badge>{String(row.original.status)}</Badge>,
      },
      { header: 'Priority', accessorKey: 'priority' },
      {
        header: 'Actions',
        cell: ({ row }) => {
          const id = String(row.original.id)
          const status = String(row.original.status)
          const workflowInstanceCount =
            typeof row.original.workflowInstanceCount === 'number'
              ? row.original.workflowInstanceCount
              : 0
          const hasWorkflowInstances = workflowInstanceCount > 0
          return (
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" type="button">
                  <Link to="/workflow-templates/$templateId" params={{ templateId: id }} className="inline-flex items-center gap-2">
                    <Eye className="h-4 w-4" /> View Details
                  </Link>
                </Button>
                {status !== 'PUBLISHED' ? (
                  <Button size="sm" type="button" onClick={() => publish.mutate({ id })}>
                    <PlayCircle className="h-4 w-4" /> Publish
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="destructive"
                  type="button"
                  disabled={hasWorkflowInstances}
                  onClick={() => deactivate.mutate({ id })}
                >
                  <XCircle className="h-4 w-4" /> Deactivate
                </Button>
              </div>
            </div>
          )
        },
      },
    ],
    [deactivate, publish],
  )

  return (
    <>
      <PageHeader
        title="Workflow Builder"
        kicker="Templates"
        description="Create, publish, duplicate, and deactivate configurable workflow templates."
        action={
          <Button type="button">
            <Link to="/workflow-templates/new" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> New workflow
            </Link>
          </Button>
        }
      />
      <ErrorNotice error={query.error} />
      <ErrorNotice error={publish.error ?? deactivate.error} />
      <DataTable columns={columns} data={rows} />
    </>
  )
}
