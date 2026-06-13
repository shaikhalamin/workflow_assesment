import { useParams } from '@tanstack/react-router'

import { Badge } from '@/components/ui/badge'
import type {
UserResponseDto,
WorkflowActionResponseDto,
WorkflowInstanceResponseDto
} from '@/lib/api/gen'
import { useAuditLogsControllerListForWorkflow,useWorkflowRuntimeControllerFindOne } from '@/lib/api/gen'
import {
formatDate,
formatValue,
unwrapData
} from '@/lib/format'
import {
AuditTable,
EmptyState,
ErrorNotice,
PageHeader,
ReadableRowsSection,
SectionHeading,
SummaryValue,
WorkflowProgressSection
} from '@/pages/utils/page-components'
import {
describeUserReference,
humanizeKey,
isRecord,
primitiveFromObjectField,
readableRowsFromRecord,
readableValue,
type Row,
type WorkflowActionWithUser
} from '@/pages/utils/page-helpers'
import { useAuthStore } from '@/stores/auth-store'

export function WorkflowInstanceDetailPage() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const query = useWorkflowRuntimeControllerFindOne({ id: instanceId })
  const logs = useAuditLogsControllerListForWorkflow({
    workflowInstanceId: instanceId,
    params: { page: 1, limit: 50 },
  })
  const instance = unwrapData(query.data) as WorkflowInstanceResponseDto | undefined
  const metadata = instance && isRecord(instance.metadataJson) ? instance.metadataJson : {}
  const headerTitle = readableValue(metadata.title) ?? 'Workflow detail'

  return (
    <>
      <PageHeader title={headerTitle} kicker="Runtime detail" />
      <ErrorNotice error={query.error} />
      {instance ? (
        <div className="space-y-5">
          <WorkflowInstanceSummary instance={instance} />
          <WorkflowProgressSection instance={instance} showActions />
          <WorkflowActionHistory actions={Array.isArray(instance.actions) ? instance.actions : []} />
          <section>
            <PageHeader title="Audit history" kicker="Logs" />
            <AuditTable rows={(unwrapData(logs.data) as Row[] | undefined) ?? []} />
          </section>
          <WorkflowTechnicalReference instance={instance} />
        </div>
      ) : null}
    </>
  )
}

function WorkflowInstanceSummary({
  instance,
}: {
  instance: WorkflowInstanceResponseDto
}) {
  const metadata = isRecord(instance.metadataJson) ? instance.metadataJson : {}
  const isLeaveWorkflow =
    instance.moduleName === 'leaves' || instance.entityType === 'LeaveRequest'
  const rawLeaveDays = primitiveFromObjectField(metadata.leaveDays)
  const parsedLeaveDays =
    typeof rawLeaveDays === 'number'
      ? rawLeaveDays
      : typeof rawLeaveDays === 'string' && rawLeaveDays.trim()
        ? Number(rawLeaveDays)
        : undefined
  const leaveDuration =
    typeof parsedLeaveDays === 'number' && Number.isFinite(parsedLeaveDays)
      ? `${parsedLeaveDays} ${parsedLeaveDays === 1 ? 'day' : 'days'}`
      : readableValue(metadata.leaveDays)
  const metadataRows = readableRowsFromRecord(instance.metadataJson).filter(
    (row) =>
      ![
        'Title',
        'Vendor',
        'Currency',
        'Amount',
        'Category',
        'Leave type',
        'Leave days',
        'Start date',
        'End date',
      ].includes(row.label),
  )
  const requester = describeUserReference(
    [],
    instance.requester ?? instance.requesterId,
  )

  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{instance.status}</Badge>
        <Badge className="bg-[var(--surface-2)] text-[var(--ink-3)]">
          {instance.moduleName}
        </Badge>
        <Badge className="bg-[var(--surface-2)] text-[var(--ink-3)]">
          {instance.eventName}
        </Badge>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Requester" value={formatValue(requester)} />
        {isLeaveWorkflow ? (
          <>
            <SummaryValue
              label="Leave type"
              value={formatValue(readableValue(metadata.leaveType))}
            />
            <SummaryValue label="Duration" value={formatValue(leaveDuration)} />
            <SummaryValue
              label="Start date"
              value={formatValue(readableValue(metadata.startDate))}
            />
            <SummaryValue
              label="End date"
              value={formatValue(readableValue(metadata.endDate))}
            />
          </>
        ) : (
          <>
            <SummaryValue
              label="Title"
              value={formatValue(readableValue(metadata.title))}
            />
            <SummaryValue
              label="Vendor"
              value={formatValue(readableValue(metadata.vendor))}
            />
            <SummaryValue
              label="Currency"
              value={formatValue(readableValue(metadata.currency))}
            />
            <SummaryValue
              label="Amount"
              value={formatValue(readableValue(metadata.amount))}
            />
            <SummaryValue
              label="Category"
              value={formatValue(readableValue(metadata.category))}
            />
          </>
        )}
        <SummaryValue label="Entity" value={`${instance.entityType} ${instance.entityId}`} />
        <SummaryValue label="Started" value={formatDate(instance.startedAt)} />
        <SummaryValue label="Completed" value={formatDate(instance.completedAt)} />
        <SummaryValue label="Rejected" value={formatDate(instance.rejectedAt)} />
        <SummaryValue label="Department" value={formatValue(instance.departmentId)} />
      </div>
      <ReadableRowsSection
        title="Metadata"
        emptyMessage="No readable metadata recorded."
        rows={metadataRows}
      />
    </section>
  )
}

function WorkflowActionHistory({
  actions,
}: {
  actions: WorkflowActionResponseDto[]
}) {
  const currentUser = useAuthStore((state) => state.user)
  const users: UserResponseDto[] = []

  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <SectionHeading label="Workflow actions" title="Action history" />
      {actions.length > 0 ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr>
                {['Action', 'Actor', 'Comment / reason', 'Created'].map((header) => (
                  <th
                    key={header}
                    className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => {
                const actionWithUser = action as WorkflowActionWithUser

                return (
                  <tr key={action.id} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-4 py-3 text-[13px]">{humanizeKey(action.action)}</td>
                    <td className="px-4 py-3 text-[13px]">
                      {formatValue(
                        describeUserReference(
                          users,
                          actionWithUser.actorUser ?? action.actorUserId,
                          currentUser,
                        ),
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      {action.comment ?? action.reason ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-[13px]">{formatDate(action.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No workflow actions recorded." />
      )}
    </section>
  )
}

function WorkflowTechnicalReference({
  instance,
}: {
  instance: WorkflowInstanceResponseDto
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <SectionHeading label="Technical metadata" title="Reference" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Instance ID" value={instance.id} />
        <SummaryValue label="Template ID" value={instance.workflowTemplateId} />
        <SummaryValue label="Rule ID" value={instance.workflowApprovalRuleId} />
        <SummaryValue label="Created" value={formatDate(instance.createdAt)} />
        <SummaryValue label="Updated" value={formatDate(instance.updatedAt)} />
      </div>
    </section>
  )
}
