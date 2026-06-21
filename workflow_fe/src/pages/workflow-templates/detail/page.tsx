import { Link,useParams } from '@tanstack/react-router'
import {
ArrowLeft,
PlayCircle
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type {
UserResponseDto,
WorkflowApprovalRuleResponseDto,
WorkflowApprovalStepConfigResponseDto,
WorkflowTemplateResponseDto
} from '@/lib/api/gen'
import { useUsersControllerGetUsers,useWorkflowTemplateControllerFindOne } from '@/lib/api/gen'
import {
formatDate,
formatValue,
rowsFrom,
unwrapData
} from '@/lib/format'
import {
EmptyState,
ErrorNotice,
PageHeader,
SectionHeading,
SummaryValue
} from '@/pages/utils/page-components'
import {
conditionGroupFromUnknown,
describeCondition,
describeStepAssignee,
outcomeActionsFromUnknown,
outcomeRows,
ruleConditionText,
stepFlags,
stepTypeLabels,
type DetailConditionGroup,
type OutcomeActionValue
} from '@/pages/utils/page-helpers'

export function WorkflowTemplateDetailPage() {
  const { templateId } = useParams({ strict: false }) as { templateId: string }
  const query = useWorkflowTemplateControllerFindOne({ id: templateId })
  const usersQuery = useUsersControllerGetUsers({ params: { page: 1, limit: 100 } })
  const template = unwrapData(query.data)
  const users = rowsFrom(usersQuery.data)

  return (
    <>
      <PageHeader
        title={template?.name ?? 'Workflow detail'}
        kicker="Template detail"
        description="Read-only workflow execution summary."
        navigation={
          <Link
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
            to="/workflow-templates"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to workflow templates
          </Link>
        }
      />
      <ErrorNotice error={query.error} />
      {template ? <WorkflowTemplateDetail template={template} users={users} /> : null}
    </>
  )
}

function WorkflowTemplateDetail({
  template,
  users,
}: {
  template: WorkflowTemplateResponseDto
  users: UserResponseDto[]
}) {
  const sortedRules = [...template.rules].sort(
    (first, second) => first.priority - second.priority,
  )
  const totalSteps = sortedRules.reduce(
    (total, rule) => total + rule.steps.length,
    0,
  )
  const triggerGroup = conditionGroupFromUnknown(
    template.triggerCondition?.conditionJson,
  )
  const approvedActions = outcomeActionsFromUnknown(
    template.outcomeConfig?.approvedActionsJson,
  )
  const rejectedActions = outcomeActionsFromUnknown(
    template.outcomeConfig?.rejectedActionsJson,
  )

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{template.status}</Badge>
          <Badge className="bg-[var(--surface-2)] text-[var(--ink-3)]">
            {template.moduleName}
          </Badge>
          <Badge className="bg-[var(--surface-2)] text-[var(--ink-3)]">
            {template.eventName}
          </Badge>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[11px] font-medium text-[var(--ink-3)]">
            Priority {template.priority}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryValue label="Entity type" value={template.entityType} />
          <SummaryValue
            label="Effective dates"
            value={`${formatDate(template.effectiveFrom)} to ${formatDate(template.effectiveTo)}`}
          />
          <SummaryValue
            label="Rules / steps"
            value={`${template.rules.length} rules / ${totalSteps} steps`}
          />
          <SummaryValue
            label="Resubmission"
            value={template.allowResubmission ? 'Allowed' : 'Not allowed'}
          />
        </div>
      </section>

      <section
        aria-label="Workflow logic"
        className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm"
        role="region"
      >
        <div className="border-b border-[var(--border)] pb-3">
          <h2
            className="mt-1 text-base font-semibold text-[var(--foreground)]"
          >
            Workflow logic
          </h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[48px_1fr]">
          <div className="hidden h-12 w-12 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--brand-soft)] text-[var(--brand-emphasis)] sm:grid">
            <PlayCircle className="h-5 w-5" />
          </div>
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
              Trigger
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
              {template.eventName}
            </p>
            <WorkflowTriggerSummary
              eventName={template.eventName}
              group={triggerGroup}
            />
          </div>
        </div>

        <div className="mt-5 border-l border-[var(--border)] pl-4 sm:ml-6 sm:pl-6">
          <p className="text-sm italic text-[var(--ink-2)]">
            Evaluates approval rules by priority
          </p>
          <div className="mt-4 space-y-5">
            {sortedRules.length > 0 ? (
              sortedRules.map((rule) => (
                <WorkflowRuleCard key={rule.id} rule={rule} users={users} />
              ))
            ) : (
              <EmptyState message="No approval rules configured." />
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-[var(--border)] pt-5">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            Outcomes
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <OutcomeCard
              title="Approved outcome"
              actions={approvedActions}
              statusFallback="No approved status configured."
            />
            <OutcomeCard
              title="Rejected outcome"
              actions={rejectedActions}
              statusFallback="No rejected status configured."
              rejected
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
        <SectionHeading label="Technical metadata" title="Reference" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryValue label="Template ID" value={template.id} />
          <SummaryValue label="Created" value={formatDate(template.createdAt)} />
          <SummaryValue label="Updated" value={formatDate(template.updatedAt)} />
          <SummaryValue
            label="Created by"
            value={formatValue(template.createdById)}
          />
        </div>
      </section>
    </div>
  )
}

function WorkflowTriggerSummary({
  eventName,
  group,
}: {
  eventName: string
  group: DetailConditionGroup | undefined
}) {
  if (!group || group.conditions.length === 0) {
    return (
      <p className="mt-3 text-sm leading-6 text-[var(--ink-2)]">
        Runs for every {eventName} event.
      </p>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm leading-6 text-[var(--ink-2)]">
        Runs when{' '}
        {group.mode === 'any'
          ? 'any trigger condition matches:'
          : 'all trigger conditions match:'}
      </p>
      <div className="flex flex-wrap gap-2">
        {group.conditions.map((condition, index) => (
          <span
            key={`${condition.field}-${condition.operator}-${index}`}
            className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11px] text-[var(--ink-2)]"
          >
            {describeCondition(condition)}
          </span>
        ))}
      </div>
    </div>
  )
}

function WorkflowRuleCard({
  rule,
  users,
}: {
  rule: WorkflowApprovalRuleResponseDto
  users: UserResponseDto[]
}) {
  const sortedSteps = [...rule.steps].sort(
    (first, second) => first.stepOrder - second.stepOrder,
  )

  return (
    <article className="rounded-md border border-[var(--border)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-3)]">
            Priority {rule.priority}
          </p>
          <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
            {rule.name}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Condition: {ruleConditionText(rule)}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge>{rule.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
          {rule.isFallback ? (
            <Badge className="bg-[var(--warning-soft)] text-[var(--warning)]">
              Fallback
            </Badge>
          ) : null}
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[11px] text-[var(--ink-3)]">
            {rule.steps.length} steps
          </span>
        </div>
      </div>
      <ApprovalStepTimeline steps={sortedSteps} users={users} />
    </article>
  )
}

function ApprovalStepTimeline({
  steps,
  users,
}: {
  steps: WorkflowApprovalStepConfigResponseDto[]
  users: UserResponseDto[]
}) {
  if (steps.length === 0) {
    return <EmptyState message="No approval steps configured." />
  }

  return (
    <ol className="mt-4 space-y-0">
      {steps.map((step, index) => {
        const flags = stepFlags(step)
        const isLastStep = index === steps.length - 1
        const slaHours = step.slaHours

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
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
                      Step {step.stepOrder}
                    </p>
                    <h4 className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                      {step.stepName || 'Unnamed step'}
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      {stepTypeLabels[step.stepType] ?? step.stepType}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      {describeStepAssignee(step, users)}
                    </p>
                  </div>
                  {slaHours ? (
                    <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]">
                      SLA {slaHours}h
                    </span>
                  ) : null}
                </div>
                {flags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {flags.map((flag) => (
                      <span
                        key={flag}
                        className="rounded-full border border-[var(--border)] bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function OutcomeCard({
  title,
  actions,
  statusFallback,
  rejected = false,
}: {
  title: string
  actions: Record<string, OutcomeActionValue>
  statusFallback: string
  rejected?: boolean
}) {
  const status = actions.setStatus
  const extraRows = outcomeRows(actions)
  const hasActions = Object.keys(actions).length > 0

  return (
    <article
      aria-label={title}
      className={`rounded-md border border-l-4 border-[var(--border)] bg-[var(--surface-2)] p-4 ${
        rejected ? 'border-l-red-600' : 'border-l-emerald-600'
      }`}
      role="region"
    >
      <h3 className="text-base font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      {hasActions ? (
        <div className="mt-3 space-y-2 text-sm text-[var(--ink-2)]">
          <p>
            {typeof status === 'string'
              ? `Set status to ${status}`
              : statusFallback}
          </p>
          {!rejected && actions.notifyRequester === true ? (
            <p>Notify requester</p>
          ) : null}
          {!rejected && actions.createPaymentRequest === true ? (
            <p>Create payment request</p>
          ) : null}
          {rejected &&
          (actions.requireReason === true ||
            actions.requiresRejectionReason === true) ? (
            <p>Require rejection reason</p>
          ) : null}
          {rejected && actions.allowResubmission === true ? (
            <p>Allow resubmission</p>
          ) : null}
          {extraRows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-3 border-t border-[var(--border)] pt-2"
            >
              <span className="text-[var(--muted-foreground)]">
                {row.label}
              </span>
              <span className="text-right font-medium text-[var(--foreground)]">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="No outcome actions configured." />
      )}
    </article>
  )
}
