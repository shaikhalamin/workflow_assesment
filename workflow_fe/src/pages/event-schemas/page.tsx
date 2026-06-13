import { useState } from 'react'

import { DataTable } from '@/components/data-table'
import {
FormField,
FormInput
} from '@/components/form'
import { Button } from '@/components/ui/button'
import { useWorkflowEventSchemaControllerCreate,useWorkflowEventSchemaControllerList } from '@/lib/api/gen'
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

export function EventSchemasPage() {
  const query = useWorkflowEventSchemaControllerList({ params: { page: 1, limit: 50 } })
  const createSchema = useWorkflowEventSchemaControllerCreate({ mutation: { onSuccess: () => void query.refetch() } })
  const [moduleName, setModuleName] = useState('expenses')
  const [eventName, setEventName] = useState('expense.submitted')
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  return (
    <>
      <PageHeader title="Workflow event schemas" kicker="Schemas" description="Field schemas drive condition fields, assignee resolvers, and outcome choices in the builder." />
      <ErrorNotice error={query.error ?? createSchema.error} />
      <div className="mb-5 grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto] md:items-end">
        <FormField label="Module">
          <FormInput value={moduleName} onChange={(event) => setModuleName(event.target.value)} />
        </FormField>
        <FormField label="Event">
          <FormInput value={eventName} onChange={(event) => setEventName(event.target.value)} />
        </FormField>
        <Button type="button" onClick={() => createSchema.mutate({ data: { moduleName, eventName, entityType: moduleName === 'leaves' ? 'Leave' : 'Expense', fieldSchemaJson: { fields: [] } } })}>
          Create schema
        </Button>
      </div>
      <DataTable
        data={rows}
        columns={[
          { header: 'Module', accessorKey: 'moduleName' },
          { header: 'Event', accessorKey: 'eventName' },
          { header: 'Entity', accessorKey: 'entityType' },
          { header: 'Active', cell: ({ row }) => formatValue(row.original.isActive) },
        ]}
      />
    </>
  )
}
