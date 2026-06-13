import { Link } from '@tanstack/react-router'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { useWorkflowRuntimeControllerList } from '@/lib/api/gen'
import {
formatDate,
unwrapData
} from '@/lib/format'
import {
ErrorNotice,
PageHeader
} from '@/pages/utils/page-components'
import {
type Row
} from '@/pages/utils/page-helpers'

export function WorkflowInstancesPage() {
  const query = useWorkflowRuntimeControllerList({ params: { page: 1, limit: 50 } })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  return (
    <>
      <PageHeader title="Workflow Runtime" kicker="Runtime" description="Runtime workflow instances created by module events." />
      <ErrorNotice error={query.error} />
      <DataTable
        data={rows}
        columns={[
          { header: 'Entity', accessorKey: 'entityId' },
          { header: 'Module', accessorKey: 'moduleName' },
          { header: 'Event', accessorKey: 'eventName' },
          { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
          { header: 'Started', cell: ({ row }) => formatDate(row.original.startedAt) },
          { header: 'Actions', cell: ({ row }) => <Link className="font-medium text-[var(--primary)]" to="/workflow-instances/$instanceId" params={{ instanceId: String(row.original.id) }}>Open</Link> },
        ]}
      />
    </>
  )
}
