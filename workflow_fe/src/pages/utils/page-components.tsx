import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2,XCircle } from 'lucide-react'
import { useState } from 'react'

import { DataTable } from '@/components/data-table'
import { FormField,FormShell,FormTextarea } from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
AuthUserDto,
UserResponseDto,
WorkflowActionResponseDto,
WorkflowInstanceResponseDto,
WorkflowStepResponseDto,
} from '@/lib/api/gen'
import { useWorkflowRuntimeControllerApprove,useWorkflowRuntimeControllerReject } from '@/lib/api/gen'
import { apiErrorMessage,formatDate,formatValue } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
import {
canActOnStep,
describeRuntimeAssignee,
describeUserReference,
getSortedRuntimeSteps,
humanizeKey,
runtimeStepStatusText,
stepTypeLabels,
timelineStepHeader,
type ReadableRow,
type Row,
type WorkflowActionWithUser,
type WorkflowStepWithUsers,
} from './page-helpers'

export function PageHeader({
  title,
  description,
  action,
  kicker = 'Workspace',
}: {
  title: string
  description?: string
  action?: React.ReactNode
  kicker?: string
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
          {kicker}
        </p>
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[26px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function ErrorNotice({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {apiErrorMessage(error)}
    </div>
  )
}

export function Metric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string | number | undefined
  tone?: 'default' | 'success' | 'warning'
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-[#eef8ff]'
      : tone === 'warning'
        ? 'bg-[var(--warning-soft)]'
        : 'bg-[var(--surface-2)]'

  return (
    <div className={`rounded-lg border border-[var(--border)] ${toneClass} p-4 shadow-sm`}>
      <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        {value ?? '-'}
      </p>
    </div>
  )
}

type StatusChartItem = {
  label: string
  value: number
  className: string
}

function statusTotal(items: StatusChartItem[]) {
  return items.reduce((total, item) => total + item.value, 0)
}

export function StatusBars({
  title,
  items,
}: {
  title: string
  items: StatusChartItem[]
}) {
  const total = statusTotal(items)

  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <span className="font-mono text-xs text-[var(--muted-foreground)]">
          Total {total}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const width = total > 0 ? Math.max((item.value / total) * 100, 4) : 0
          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-[var(--ink-3)]">{item.label}</span>
                <span className="font-mono text-[var(--muted-foreground)]">
                  {item.value}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
                <div
                  className={`h-full rounded-full ${item.className}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function RecentActivityList({
  items,
}: {
  items: Array<{ id: string; type: string; title: string; createdAt: string }>
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">
          Recent workflow activity
        </h2>
        <span className="font-mono text-xs text-[var(--muted-foreground)]">
          Latest {items.length}
        </span>
      </div>
      <div className="mt-4 divide-y divide-[var(--border)]">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {item.type}
                </p>
              </div>
              <p className="font-mono text-xs text-[var(--muted-foreground)]">
                {formatDate(item.createdAt)}
              </p>
            </div>
          ))
        ) : (
          <p className="py-6 text-sm text-[var(--muted-foreground)]">
            No workflow activity for this date range.
          </p>
        )}
      </div>
    </section>
  )
}

export function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
        {label}
      </p>
      <h2 className="mt-1 text-base font-semibold text-[var(--foreground)]">
        {title}
      </h2>
    </div>
  )
}

export function SummaryValue({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-3)]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-[var(--foreground)]">
        {value}
      </p>
    </div>
  )
}

export function ReadableRowsSection({
  title,
  rows,
  emptyMessage,
}: {
  title: string
  rows: ReadableRow[]
  emptyMessage: string
}) {
  if (rows.length === 0) return <EmptyState message={emptyMessage} />

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div
          key={`${title}-${row.label}`}
          className="flex items-start justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
        >
          <span className="text-[var(--muted-foreground)]">{row.label}</span>
          <span className="text-right font-medium text-[var(--foreground)]">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
      {message}
    </p>
  )
}

export function AuditTable({ rows }: { rows: Row[] }) {
  return (
    <DataTable
      data={rows}
      columns={[
        { header: 'Action', accessorKey: 'action' },
        { header: 'Entity', cell: ({ row }) => `${formatValue(row.original.entityType)} ${formatValue(row.original.entityId)}` },
        { header: 'Status', cell: ({ row }) => `${formatValue(row.original.oldStatus)} -> ${formatValue(row.original.newStatus)}` },
        { header: 'Comment', accessorKey: 'comment' },
        { header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
      ]}
    />
  )
}

export function SummaryCard({
  title,
  rows,
}: {
  title: string
  rows: Array<{ label: string; value: React.ReactNode }>
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-3)]">
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-[var(--muted-foreground)]">{row.label}</span>
            <span className="text-right font-medium text-[var(--foreground)]">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CreatePanel({
  title,
  kicker,
  description,
  children,
  aside,
  error,
  onSubmit,
  submitLabel = 'Save',
}: {
  title: string
  kicker: string
  description: string
  children: React.ReactNode
  aside?: React.ReactNode
  error: unknown
  onSubmit: () => void
  submitLabel?: string
}) {
  return (
    <FormShell
      kicker={kicker}
      title={title}
      description={description}
      aside={aside}
    >
      <ErrorNotice error={error} />
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        {children}
        <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-[var(--ink-3)]">
            API payload and navigation stay unchanged.
          </p>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </FormShell>
  )
}

export function WorkflowProgressSection({
  instance,
  showActions = false,
}: {
  instance: WorkflowInstanceResponseDto
  showActions?: boolean
}) {
  const user = useAuthStore((state) => state.user)
  const users: UserResponseDto[] = []
  const steps = getSortedRuntimeSteps(instance)
  const activeStep = steps.find((step) => step.status === 'ACTIVE')
  const nextWaitingStep = steps.find((step) => step.status === 'WAITING')
  const canUserActOnActiveStep =
    activeStep && showActions && canActOnStep(activeStep, user?.roles ?? [], user?.id)

  return (
    <section
      aria-label="Workflow progress"
      className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm"
      role="region"
    >
      <SectionHeading label="Workflow status" title="Workflow progress" />
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <ResponsibilitySummary
          title="Current responsibility"
          instance={instance}
          step={activeStep}
          users={users}
          currentUser={user}
          fallback={
            instance.status === 'APPROVED'
              ? 'Workflow completed.'
              : instance.status === 'REJECTED'
                ? 'Workflow rejected.'
                : 'No active step.'
          }
        />
        <ResponsibilitySummary
          title="Next responsibility"
          instance={instance}
          step={nextWaitingStep}
          users={users}
          currentUser={user}
          fallback="No waiting steps."
        />
      </div>
      <RuntimeStepTimeline
        steps={steps}
        users={users}
        requesterId={instance.requesterId}
        currentUser={user}
        actionStepId={canUserActOnActiveStep ? activeStep.id : undefined}
        actionPanel={
          canUserActOnActiveStep ? (
            <WorkflowDecisionPanel
              step={activeStep}
              users={users}
              requesterId={instance.requesterId}
              currentUser={user}
              workflowInstanceId={instance.id}
            />
          ) : null
        }
      />
    </section>
  )
}

function ResponsibilitySummary({
  title,
  instance,
  step,
  users,
  currentUser,
  fallback,
}: {
  title: string
  instance: WorkflowInstanceResponseDto
  step: WorkflowStepResponseDto | undefined
  users: UserResponseDto[]
  currentUser?: AuthUserDto | null
  fallback: string
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
        {title}
      </p>
      {step ? (
        <>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
            {title === 'Current responsibility' ? 'Active' : 'Next'}:{' '}
            {step.stepName || 'Unnamed step'}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
            {describeRuntimeAssignee(step, users, instance.requesterId, currentUser)}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
          {instance.status === 'REJECTED'
            ? stepsRejectedText(instance)
            : fallback}
        </p>
      )}
    </div>
  )
}

function stepsRejectedText(instance: WorkflowInstanceResponseDto) {
  const rejectedStep = getSortedRuntimeSteps(instance).find(
    (step) => step.status === 'REJECTED',
  )
  return rejectedStep
    ? `Rejected at ${rejectedStep.stepName || 'unnamed step'}.`
    : 'Workflow rejected.'
}

function RuntimeStepTimeline({
  steps,
  users,
  requesterId,
  currentUser,
  actionStepId,
  actionPanel,
}: {
  steps: WorkflowStepResponseDto[]
  users: UserResponseDto[]
  requesterId: string
  currentUser?: AuthUserDto | null
  actionStepId?: string
  actionPanel?: React.ReactNode
}) {
  if (steps.length === 0) {
    return <EmptyState message="No approval steps recorded." />
  }

  return (
    <ol className="mt-4 space-y-0">
      {steps.map((step, index) => {
        const stepWithUsers = step as WorkflowStepWithUsers
        const header = timelineStepHeader(step, users, requesterId, currentUser)
        const isLastStep = index === steps.length - 1
        const tone =
          step.status === 'ACTIVE'
            ? 'border-l-blue-600 bg-white'
            : step.status === 'APPROVED'
              ? 'border-l-emerald-600 bg-white'
              : step.status === 'REJECTED'
                ? 'border-l-red-600 bg-white'
                : 'border-l-slate-300 bg-white'

        return (
          <li key={step.id} className="grid grid-cols-[32px_1fr] gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--primary)] bg-[var(--primary)] font-mono text-[10px] font-semibold text-white">
                {step.stepOrder}
              </span>
              {!isLastStep ? (
                <span className="h-full min-h-8 w-px bg-[var(--border)]" />
              ) : null}
            </div>
            <div className={isLastStep ? '' : 'pb-4'}>
              <article className={`rounded-md border border-l-4 border-[var(--border)] ${tone} p-3`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
                      Step {step.stepOrder}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                      {header.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[var(--muted-foreground)]">
                      {header.subtitle}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      Action Type: {stepTypeLabels[step.stepType] ?? humanizeKey(step.stepType)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      Assignee: {describeRuntimeAssignee(step, users, requesterId, currentUser)}
                    </p>
                  </div>
                  <Badge>{step.status}</Badge>
                </div>
                <p className="mt-2 text-xs font-medium text-[var(--ink-2)]">
                  {runtimeStepStatusText[step.status]}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryValue label="Activated" value={formatDate(step.activatedAt)} />
                  <SummaryValue label="Acted" value={formatDate(step.actedAt)} />
                  <SummaryValue
                    label="Actor"
                    value={formatValue(
                      describeUserReference(
                        users,
                        stepWithUsers.actionByUser ?? step.actionByUserId,
                        currentUser,
                      ),
                    )}
                  />
                  <SummaryValue
                    label="Resolved assignee"
                    value={describeRuntimeAssignee(step, users, requesterId, currentUser)}
                  />
                  <SummaryValue label="Assignment rule" value={humanizeKey(step.assigneeType)} />
                </div>
                {step.comment ? (
                  <p className="mt-3 text-sm text-[var(--ink-2)]">
                    Comment: {step.comment}
                  </p>
                ) : null}
                {step.rejectionReason ? (
                  <p className="mt-3 text-sm text-red-700">
                    Rejection reason: {step.rejectionReason}
                  </p>
                ) : null}
                <StepActionHistory
                  actions={Array.isArray(step.actions) ? step.actions : []}
                  users={users}
                  currentUser={currentUser}
                />
              </article>
              {step.id === actionStepId ? actionPanel : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function StepActionHistory({
  actions,
  users,
  currentUser,
}: {
  actions: WorkflowActionResponseDto[]
  users: UserResponseDto[]
  currentUser?: AuthUserDto | null
}) {
  const visibleActions = actions.filter((action) => action.action !== 'STEP_ACTIVATED')

  if (visibleActions.length === 0) return null

  return (
    <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
        Step actions
      </p>
      {visibleActions.map((action) => {
        const actionWithUser = action as WorkflowActionWithUser

        return (
          <div
            key={action.id}
            className="grid gap-1 rounded-md bg-white px-3 py-2 text-xs text-[var(--ink-2)] sm:grid-cols-4"
          >
            <span className="font-semibold text-[var(--foreground)]">
              {humanizeKey(action.action)}
            </span>
            <span>
              Actor:{' '}
              {formatValue(
                describeUserReference(
                  users,
                  actionWithUser.actorUser ?? action.actorUserId,
                  currentUser,
                ),
              )}
            </span>
            <span>{formatDate(action.createdAt)}</span>
            <span>{action.comment ?? action.reason ?? '-'}</span>
          </div>
        )
      })}
    </div>
  )
}

function WorkflowDecisionPanel({
  step,
  users,
  requesterId,
  currentUser,
  workflowInstanceId,
}: {
  step: WorkflowStepResponseDto
  users: UserResponseDto[]
  requesterId: string
  currentUser?: AuthUserDto | null
  workflowInstanceId: string
}) {
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')
  const approve = useWorkflowRuntimeControllerApprove({
    mutation: {
      onSuccess: () => void queryClient.invalidateQueries(),
    },
  })
  const reject = useWorkflowRuntimeControllerReject({
    mutation: {
      onSuccess: () => void queryClient.invalidateQueries(),
    },
  })

  return (
    <section
      aria-label="Approval decision"
      className="mt-4 rounded-md border border-[var(--border)] bg-white p-4"
      role="region"
    >
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
        Current approver action
      </p>
      <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
        Active approval step
      </h3>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Assigned to {describeRuntimeAssignee(step, users, requesterId, currentUser)}
      </p>
      <div className="mt-3">
        <FormField label="Comment or rejection reason" htmlFor="workflow-decision-comment">
          <FormTextarea
            id="workflow-decision-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </FormField>
      </div>
      <ErrorNotice error={approve.error ?? reject.error} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={approve.isPending || reject.isPending}
          onClick={() => approve.mutate({ id: step.id, data: { comment } })}
        >
          <CheckCircle2 className="h-4 w-4" /> Approve
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={approve.isPending || reject.isPending}
          onClick={() => reject.mutate({ id: step.id, data: { reason: comment } })}
        >
          <XCircle className="h-4 w-4" /> Reject
        </Button>
      </div>
      <p className="mt-3 font-mono text-[10px] text-[var(--ink-3)]">
        Workflow {workflowInstanceId}
      </p>
    </section>
  )
}
