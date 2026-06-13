import { Link,useParams } from '@tanstack/react-router'
import {
Pencil
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
LeaveResponseDto,
WorkflowInstanceResponseDto
} from '@/lib/api/gen'
import { useLeavesControllerFindOne,useWorkflowRuntimeControllerFindOne } from '@/lib/api/gen'
import {
formatDate,
formatValue,
unwrapData
} from '@/lib/format'
import {
EmptyState,
ErrorNotice,
PageHeader,
SectionHeading,
SummaryValue,
WorkflowProgressSection
} from '@/pages/utils/page-components'
import {
describeUserReference,
formatOptionalDate,
workflowIdFromLeave
} from '@/pages/utils/page-helpers'

export function LeaveDetailPage() {
  const { leaveId } = useParams({ strict: false }) as { leaveId: string }
  const query = useLeavesControllerFindOne({ id: leaveId })
  const leave = unwrapData(query.data) as LeaveResponseDto | undefined
  const workflowId = leave ? workflowIdFromLeave(leave) : undefined
  const workflowQuery = useWorkflowRuntimeControllerFindOne({ id: workflowId })
  const workflow = workflowId
    ? (unwrapData(workflowQuery.data) as WorkflowInstanceResponseDto | undefined)
    : undefined
  const canEditAndResubmit = leave?.status === 'REJECTED' && leave.canResubmit === true

  return (
    <>
      <PageHeader
        title={leave ? `Leave ${leave.leaveType}` : `Leave ${leaveId}`}
        kicker="Leave detail"
        action={
          canEditAndResubmit || workflowId ? (
            <div className="flex flex-wrap items-center gap-2">
              {canEditAndResubmit ? (
                <Button
                  className="border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                  type="button"
                >
                  <Link
                    className="inline-flex items-center gap-2"
                    to="/leaves/$leaveId/edit"
                    params={{ leaveId }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit and resubmit
                  </Link>
                </Button>
              ) : null}
              {workflowId ? (
                <Button
                  className="border-sky-700 bg-sky-600 text-white shadow-sm hover:bg-sky-700"
                  type="button"
                >
                  <Link
                    to="/workflow-instances/$instanceId"
                    params={{ instanceId: workflowId }}
                  >
                    Full workflow detail
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />
      <ErrorNotice error={query.error ?? workflowQuery.error} />
      {leave ? (
        <div className="space-y-5">
          <LeaveSummary leave={leave} />
          {workflowId ? (
            workflow ? (
              <WorkflowProgressSection instance={workflow} showActions />
            ) : (
              <EmptyState message="Workflow detail is not available yet." />
            )
          ) : (
            <EmptyState message="No workflow has been started for this leave request." />
          )}
          <LeaveTechnicalReference leave={leave} />
        </div>
      ) : null}
    </>
  )
}

function LeaveSummary({ leave }: { leave: LeaveResponseDto }) {
  const requester = describeUserReference([], leave.requester ?? leave.requesterId)
  const createdBy = describeUserReference([], leave.createdBy ?? leave.createdById)
  const leaveDayLabel = leave.leaveDays === 1 ? 'day' : 'days'

  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{leave.status}</Badge>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Requester" value={formatValue(requester)} />
        <SummaryValue label="Leave type" value={leave.leaveType} />
        <SummaryValue label="Duration" value={`${leave.leaveDays} ${leaveDayLabel}`} />
        <SummaryValue label="Start date" value={leave.startDate} />
        <SummaryValue label="End date" value={leave.endDate} />
        <SummaryValue label="Employee grade" value={formatValue(leave.employeeGrade)} />
        <SummaryValue label="Submitted" value={formatOptionalDate(leave.submittedAt)} />
        <SummaryValue label="Approved" value={formatOptionalDate(leave.approvedAt)} />
        <SummaryValue label="Rejected" value={formatOptionalDate(leave.rejectedAt)} />
        <SummaryValue label="Created" value={formatDate(leave.createdAt)} />
        <SummaryValue label="Updated" value={formatDate(leave.updatedAt)} />
      </div>
      {leave.reason ? (
        <div className="mt-4 rounded-md border border-[var(--border)] bg-white p-3 text-sm leading-6 text-black">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
            Reason
          </p>
          <p className="mt-1 text-black">{leave.reason}</p>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Request created by" value={formatValue(createdBy)} />
      </div>
      {leave.rejectionReason ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
          Rejection reason: {leave.rejectionReason}
        </div>
      ) : null}
    </section>
  )
}

function LeaveTechnicalReference({
  leave,
}: {
  leave: LeaveResponseDto
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <SectionHeading label="Technical metadata" title="Reference" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Leave ID" value={leave.id} />
        <SummaryValue label="Department" value={formatValue(leave.departmentId)} />
        <SummaryValue label="Workflow ID" value={formatValue(workflowIdFromLeave(leave))} />
      </div>
    </section>
  )
}
