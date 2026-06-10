import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Copy,
  Eye,
  FilePlus2,
  PlayCircle,
  Plus,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { useAuditLogsControllerList } from '@/lib/api/gen'
import { useAuditLogsControllerListForWorkflow } from '@/lib/api/gen'
import { useDashboardControllerAccounts } from '@/lib/api/gen'
import { useDashboardControllerAdmin } from '@/lib/api/gen'
import { useDashboardControllerApprover } from '@/lib/api/gen'
import { useDashboardControllerEmployee } from '@/lib/api/gen'
import { useDashboardControllerHr } from '@/lib/api/gen'
import { useExpensesControllerCreate } from '@/lib/api/gen'
import { useExpensesControllerFindOne } from '@/lib/api/gen'
import { useExpensesControllerList } from '@/lib/api/gen'
import { useExpensesControllerSubmit } from '@/lib/api/gen'
import { useLeavesControllerCreate } from '@/lib/api/gen'
import { useLeavesControllerFindOne } from '@/lib/api/gen'
import { useLeavesControllerList } from '@/lib/api/gen'
import { useLeavesControllerSubmit } from '@/lib/api/gen'
import { usePaymentsControllerList } from '@/lib/api/gen'
import { usePaymentsControllerMarkPaid } from '@/lib/api/gen'
import { useUsersControllerGetUsers } from '@/lib/api/gen'
import { useWorkflowEventSchemaControllerCreate } from '@/lib/api/gen'
import { useWorkflowEventSchemaControllerList } from '@/lib/api/gen'
import { useWorkflowRuntimeControllerApprove } from '@/lib/api/gen'
import { useWorkflowRuntimeControllerFindOne } from '@/lib/api/gen'
import { useWorkflowRuntimeControllerList } from '@/lib/api/gen'
import { useWorkflowRuntimeControllerMyPending } from '@/lib/api/gen'
import { useWorkflowRuntimeControllerReject } from '@/lib/api/gen'
import { useWorkflowTemplateControllerCreateWizard } from '@/lib/api/gen'
import { useWorkflowTemplateControllerDeactivate } from '@/lib/api/gen'
import { useWorkflowTemplateControllerDuplicate } from '@/lib/api/gen'
import { useWorkflowTemplateControllerFindOne } from '@/lib/api/gen'
import { useWorkflowTemplateControllerList } from '@/lib/api/gen'
import { useWorkflowTemplateControllerPublish } from '@/lib/api/gen'
import type {
  CreateExpenseDto,
  CreateLeaveDto,
  UserResponseDto,
  WorkflowApprovalRuleResponseDto,
  WorkflowApprovalStepConfigResponseDto,
  WorkflowStepResponseDto,
  WorkflowTemplateResponseDto,
} from '@/lib/api/gen'
import { DataTable } from '@/components/data-table'
import {
  FormCheckbox,
  FormField,
  FormInput,
  FormSection,
  FormSelect,
  FormShell,
  FormTextarea,
} from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/features/auth/auth-routing'
import {
  createDefaultWorkflowDraft,
  describeWorkflowAssignee,
  formatRoleLabel,
  getConditionFieldExample,
  getDefaultConditionOperator,
  getWorkflowBuilderStepState,
  getWorkflowModule,
  parseConditionValue,
  roleOptions,
  toWorkflowWizardPayload,
  useWorkflowBuilderStore,
  workflowBuilderSteps,
  workflowModules,
  type WorkflowDraft,
  type WorkflowRuleDraft,
  type WorkflowStepDraft,
} from '@/features/workflows/workflow-builder-store'
import {
  apiErrorMessage,
  formatDate,
  formatValue,
  rowsFrom,
  unwrapData,
} from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'

type Row = Record<string, unknown>

type DetailConditionValue = string | number | boolean | Array<string | number>

type DetailCondition = {
  field: string
  operator: string
  value?: DetailConditionValue
}

type DetailConditionGroup = {
  mode: 'all' | 'any'
  conditions: DetailCondition[]
}

type OutcomeActionValue = string | number | boolean

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringFromObjectField(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function numberFromObjectField(value: unknown) {
  return typeof value === 'number' ? value : undefined
}

function conditionValueFromUnknown(
  value: unknown,
): DetailConditionValue | undefined {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (
    Array.isArray(value) &&
    value.every((item) => typeof item === 'string' || typeof item === 'number')
  ) {
    return value
  }

  return undefined
}

function conditionGroupFromUnknown(
  value: unknown,
): DetailConditionGroup | undefined {
  if (!isRecord(value)) return undefined
  const mode = value.mode === 'any' ? 'any' : 'all'
  if (!Array.isArray(value.conditions)) return undefined

  const conditions = value.conditions
    .map((item): DetailCondition | undefined => {
      if (
        !isRecord(item) ||
        typeof item.field !== 'string' ||
        typeof item.operator !== 'string'
      ) {
        return undefined
      }

      return {
        field: item.field,
        operator: item.operator,
        value: conditionValueFromUnknown(item.value),
      }
    })
    .filter((item): item is DetailCondition => Boolean(item))

  return { mode, conditions }
}

function outcomeActionsFromUnknown(
  value: unknown,
): Record<string, OutcomeActionValue> {
  if (!isRecord(value)) return {}

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, OutcomeActionValue] => {
      const [, item] = entry
      return (
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean'
      )
    }),
  )
}

const conditionOperatorLabels: Record<string, string> = {
  eq: 'equals',
  neq: 'does not equal',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  between: 'between',
  in: 'is one of',
  not_in: 'is not one of',
  contains: 'contains',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
}

const stepTypeLabels: Record<string, string> = {
  REVIEW: 'Review',
  APPROVAL: 'Approval',
  FINANCE_CHECK: 'Finance check',
  HR_CHECK: 'HR check',
  MANAGEMENT_APPROVAL: 'Management approval',
  FINAL_VERIFICATION: 'Final verification',
}

function humanizeKey(value: string) {
  const label = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .toLowerCase()

  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatConditionValue(value: DetailConditionValue | undefined) {
  if (Array.isArray(value)) return value.join(', ')
  return formatValue(value)
}

function describeCondition(condition: DetailCondition) {
  const operator =
    conditionOperatorLabels[condition.operator] ?? condition.operator
  if (
    condition.operator === 'is_empty' ||
    condition.operator === 'is_not_empty'
  ) {
    return `${condition.field} ${operator}`
  }

  return `${condition.field} ${operator} ${formatConditionValue(condition.value)}`
}

function describeConditionGroup(group: DetailConditionGroup | undefined) {
  if (!group || group.conditions.length === 0) return 'No conditions configured.'
  const prefix =
    group.mode === 'any' ? 'Any condition can match' : 'All conditions must match'
  return `${prefix}: ${group.conditions.map(describeCondition).join(', ')}`
}

function describeStepAssignee(step: WorkflowApprovalStepConfigResponseDto) {
  if (step.assigneeType === 'ROLE') {
    const role = stringFromObjectField(step.assigneeRoleSlug)
    return role ? `Role: ${formatRoleLabel(role)}` : 'Needs assignment'
  }

  if (step.assigneeType === 'USER') {
    const userId = stringFromObjectField(step.assigneeUserId)
    return userId ? `User ID: ${userId}` : 'Needs assignment'
  }

  if (step.assigneeType === 'REQUESTER_MANAGER') {
    return "Requester's manager"
  }

  if (step.assigneeType === 'DEPARTMENT_HEAD') {
    return 'Department head'
  }

  const fieldPath = stringFromObjectField(step.assigneeFieldPath)
  return fieldPath ? `User from event field: ${fieldPath}` : 'Needs assignment'
}

function stepFlags(step: WorkflowApprovalStepConfigResponseDto) {
  return [
    step.isRequired ? 'Required' : undefined,
    step.canReject ? 'Can reject' : undefined,
    step.requiresComment ? 'Comment required' : undefined,
    step.requiresAttachment ? 'Attachment required' : undefined,
    step.canReassign ? 'Reassign allowed' : undefined,
  ].filter((item): item is string => Boolean(item))
}

function ruleConditionText(rule: WorkflowApprovalRuleResponseDto) {
  if (rule.isFallback) return 'Fallback path when no earlier rule matches.'
  const group = conditionGroupFromUnknown(rule.conditionJson)
  return describeConditionGroup(group)
}

function outcomeRows(actions: Record<string, OutcomeActionValue>) {
  const handledKeys = new Set([
    'setStatus',
    'notifyRequester',
    'createPaymentRequest',
    'requireReason',
    'requiresRejectionReason',
    'allowResubmission',
  ])

  return Object.entries(actions)
    .filter(([key]) => !handledKeys.has(key))
    .map(([key, value]) => ({
      label: humanizeKey(key),
      value: formatValue(value),
    }))
}

function PageHeader({
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

function ErrorNotice({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {apiErrorMessage(error)}
    </div>
  )
}

function Metric({
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

export function DashboardPage() {
  const admin = useDashboardControllerAdmin()
  const employee = useDashboardControllerEmployee()
  const approver = useDashboardControllerApprover()
  const accounts = useDashboardControllerAccounts()
  const hr = useDashboardControllerHr()
  const pending = useWorkflowRuntimeControllerMyPending()
  const adminData = unwrapData(admin.data)
  const employeeData = unwrapData(employee.data)
  const approverData = unwrapData(approver.data)
  const accountsData = unwrapData(accounts.data)
  const hrData = unwrapData(hr.data)
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const pendingRows = (unwrapData(pending.data) as WorkflowStepResponseDto[] | undefined) ?? []
  const filteredPendingRows = pendingRows.filter((row) => {
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter
    const searchable = [
      row.stepName,
      row.stepType,
      row.assigneeType,
      row.status,
      formatValue(row.assignedRoleSlug),
      formatValue(row.assignedUserId),
    ]
      .join(' ')
      .toLowerCase()
    return matchesStatus && searchable.includes(query.toLowerCase())
  })

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
            Operations
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[26px]">
            Dashboard
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">
            Role-aware operational summary across workflow configuration, approvals, HR, and accounts.
          </p>
        </div>
      </header>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Published workflows" value={adminData?.workflows?.active} tone="success" />
        <Metric label="Pending approvals" value={approverData?.pendingTasks} tone="warning" />
        <Metric label="Expense drafts" value={employeeData?.expenses?.draft} />
        <Metric label="Pending payments" value={accountsData?.pendingPayments} tone="warning" />
        <Metric label="HR leave tasks" value={hrData?.leaveTasks} />
        <Metric label="Failed triggers" value={adminData?.failedTriggers} tone="warning" />
        <Metric label="Acted tasks" value={approverData?.actedTasks} tone="success" />
        <Metric label="Leave under review" value={employeeData?.leaves?.underReview} />
      </div>
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
              Pending approvals
            </p>
            <h2 className="text-lg font-semibold tracking-tight">My approval queue</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'ACTIVE', 'WAITING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-2.5 py-1 text-[12px] font-medium ${
                statusFilter === status
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-white'
                  : 'border-[var(--border)] bg-white text-[var(--ink-3)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {status === 'all' ? 'All' : status.replaceAll('_', ' ')}
            </button>
          ))}
          <div className="ml-0 flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 sm:ml-auto sm:max-w-[280px]">
            <FormInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search task, type, assignee"
              className="h-7 border-0 px-0 focus:ring-0"
            />
          </div>
        </div>
        <TaskTable rows={filteredPendingRows} />
      </section>
    </div>
  )
}

export function WorkflowTemplatesPage() {
  const query = useWorkflowTemplateControllerList({ params: { page: 1, limit: 50 } })
  const duplicate = useWorkflowTemplateControllerDuplicate({
    mutation: { onSuccess: () => void query.refetch() },
  })
  const publish = useWorkflowTemplateControllerPublish({
    mutation: { onSuccess: () => void query.refetch() },
  })
  const deactivate = useWorkflowTemplateControllerDeactivate({
    mutation: { onSuccess: () => void query.refetch() },
  })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
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
          return (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" type="button">
                <Link to="/workflow-templates/$templateId" params={{ templateId: id }}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="sm" variant="secondary" type="button" onClick={() => duplicate.mutate({ id })}>
                <Copy className="h-4 w-4" /> Duplicate
              </Button>
              <Button size="sm" type="button" onClick={() => publish.mutate({ id })}>
                <PlayCircle className="h-4 w-4" /> Publish
              </Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => deactivate.mutate({ id })}>
                Deactivate
              </Button>
            </div>
          )
        },
      },
    ],
    [deactivate, duplicate, publish],
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
      <DataTable columns={columns} data={rows} />
    </>
  )
}

export function WorkflowBuilderPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { step, setStep, draft, setDraft, reset } = useWorkflowBuilderStore()
  const usersQuery = useUsersControllerGetUsers({ params: { page: 1, limit: 100 } })
  const users = rowsFrom(usersQuery.data)
  const currentStep = workflowBuilderSteps.find((item) => item.id === step)
  const createWizard = useWorkflowTemplateControllerCreateWizard({
    mutation: {
      onSuccess: async (response) => {
        reset()
        await queryClient.invalidateQueries()
        const id = unwrapData(response)?.id
        await navigate({
          to: id ? '/workflow-templates/$templateId' : '/workflow-templates',
          params: id ? { templateId: id } : undefined,
        })
      },
    },
  })

  return (
    <FormShell
      kicker="Workflow templates"
      title="Create workflow template"
      description={
        currentStep
          ? currentStep.description
          : 'Configure the business event, approval chain, and final outcomes.'
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11px] text-[var(--ink-3)]">
            {currentStep?.name ?? 'Workflow'} - {step} of {workflowBuilderSteps.length}
          </span>
        </div>
      }
      aside={
        <WorkflowPreview draft={draft} users={users} />
      }
    >
      <ErrorNotice error={createWizard.error} />
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {workflowBuilderSteps.map((item) => {
          const state = getWorkflowBuilderStepState(step, item.id)
          const stateLabel =
            state === 'complete'
              ? 'Complete'
              : state === 'current'
                ? 'Current'
                : 'Upcoming'
          return (
          <button
            key={item.id}
            type="button"
            className={`min-h-16 rounded-md border px-3 py-2 text-left transition ${
              state === 'current'
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-white'
                : state === 'complete'
                  ? 'border-[var(--primary)] bg-[var(--brand-soft)] text-[var(--brand-emphasis)]'
                  : 'border-[var(--border)] bg-white text-[var(--ink-3)] hover:bg-[var(--surface-2)]'
            }`}
            onClick={() => setStep(item.id)}
          >
            <span className="flex items-center gap-2">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full font-mono text-[10px] ${
                  state === 'current'
                    ? 'bg-white/15 text-white'
                    : 'bg-[var(--surface-2)] text-[var(--ink-3)]'
                }`}
              >
                {String(item.id).padStart(2, '0')}
              </span>
              <span className="block text-sm font-semibold">{item.name}</span>
            </span>
            <span
              className={`mt-1 block font-mono text-[10px] uppercase tracking-[0.08em] ${
                state === 'current' ? 'text-white/80' : 'text-[var(--muted-foreground)]'
              }`}
            >
              {stateLabel}
            </span>
          </button>
          )
        })}
      </div>
      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        {step === 1 ? <WorkflowSetup draft={draft} setDraft={setDraft} /> : null}
        {step === 2 ? <ApprovalRules draft={draft} setDraft={setDraft} /> : null}
        {step === 3 ? (
          <ApprovalSteps
            draft={draft}
            setDraft={setDraft}
            users={users}
            usersLoading={usersQuery.isLoading}
          />
        ) : null}
        {step === 4 ? <Outcomes draft={draft} setDraft={setDraft} /> : null}
        {step === 5 ? <ReviewWorkflow draft={draft} /> : null}
        <div className="mt-6 flex justify-between border-t border-[var(--border)] pt-4">
          <Button type="button" variant="secondary" disabled={step === 1} onClick={() => setStep(step - 1)}>
            Back
          </Button>
          {step < workflowBuilderSteps.length ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!draft.template.name || createWizard.isPending}
              onClick={() =>
                createWizard.mutate({ data: toWorkflowWizardPayload(draft) })
              }
            >
              Save workflow
            </Button>
          )}
        </div>
      </div>
    </FormShell>
  )
}

function BasicInfo({
  draft,
  setDraft,
}: {
  draft: WorkflowDraft
  setDraft: (draft: WorkflowDraft) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Workflow Name">
        <FormInput value={draft.template.name} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, name: event.target.value } })} />
      </Field>
      <Field label="Status">
        <FormSelect value={draft.template.status} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, status: event.target.value as 'DRAFT' | 'PUBLISHED' } })}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </FormSelect>
      </Field>
      <Field label="Description">
        <FormTextarea value={draft.template.description} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, description: event.target.value } })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Priority">
          <FormInput type="number" value={draft.template.priority} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, priority: Number(event.target.value) } })} />
        </Field>
        <Field label="Effective From">
          <FormInput type="date" value={draft.template.effectiveFrom ?? ''} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, effectiveFrom: event.target.value } })} />
        </Field>
        <Field label="Effective To">
          <FormInput type="date" value={draft.template.effectiveTo ?? ''} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, effectiveTo: event.target.value } })} />
        </Field>
      </div>
      <FormCheckbox
        label="Allow resubmission after rejection"
        checked={draft.template.allowResubmission}
        onChange={(event) => setDraft({ ...draft, template: { ...draft.template, allowResubmission: event.target.checked } })}
      />
    </div>
  )
}

function WorkflowSetup({
  draft,
  setDraft,
}: {
  draft: WorkflowDraft
  setDraft: (draft: WorkflowDraft) => void
}) {
  return (
    <div className="space-y-5">
      <FormSection
        index="01"
        title="Basics"
        hint="Name, status, priority, dates, and resubmission policy."
      >
        <BasicInfo draft={draft} setDraft={setDraft} />
      </FormSection>
      <FormSection
        index="02"
        title="Event"
        hint="The business module event that starts this workflow."
      >
        <ModuleEvent draft={draft} setDraft={setDraft} />
      </FormSection>
      <FormSection
        index="03"
        title="Trigger"
        hint="Choose whether every event runs this workflow or only matching events do."
      >
        <TriggerConditions draft={draft} setDraft={setDraft} />
      </FormSection>
    </div>
  )
}

function ModuleEvent({ draft, setDraft }: { draft: WorkflowDraft; setDraft: (draft: WorkflowDraft) => void }) {
  const selected = getWorkflowModule(draft.template.moduleName) ?? workflowModules[0]
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Module">
        <FormSelect
          value={selected.moduleName}
          onChange={(event) => {
            const module = getWorkflowModule(event.target.value) ?? workflowModules[0]
            setDraft({
              ...draft,
              template: {
                ...draft.template,
                moduleName: module.moduleName,
                eventName: module.eventName,
                entityType: module.entityType,
              },
            })
          }}
        >
          {workflowModules.map((item) => (
            <option key={item.moduleName} value={item.moduleName}>
              {item.label}
            </option>
          ))}
        </FormSelect>
      </Field>
      <Field label="Module Event">
        <FormInput value={selected.eventName} readOnly />
      </Field>
      <Field label="Entity Type">
        <FormInput value={selected.entityType} readOnly />
      </Field>
      <div className="rounded-md bg-[var(--muted)] p-4 text-sm text-[var(--muted-foreground)]">
        {selected.description}
      </div>
    </div>
  )
}

function TriggerConditions({ draft, setDraft }: { draft: WorkflowDraft; setDraft: (draft: WorkflowDraft) => void }) {
  const fields = getWorkflowModule(draft.template.moduleName)?.fields ?? []
  const defaultField = fields[0]?.key ?? 'amount'
  const condition = draft.triggerConditions.conditions[0] ?? {
    field: defaultField,
    operator: getDefaultConditionOperator(defaultField),
    value: '',
  }
  const fieldExample = getConditionFieldExample(condition.field)
  return (
    <div className="space-y-4">
      <Field label="Condition Mode">
        <FormSelect value={draft.triggerMode} onChange={(event) => setDraft({ ...draft, triggerMode: event.target.value as 'always' | 'conditions' })}>
          <option value="always">Run Always</option>
          <option value="conditions">Run When Conditions Match</option>
        </FormSelect>
      </Field>
      {draft.triggerMode === 'always' ? (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-6 text-[var(--ink-2)]">
          This workflow starts for every {draft.template.eventName} event in the selected module.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Field">
            <FormSelect value={condition.field} onChange={(event) => {
              const field = event.target.value
              setDraft({
                ...draft,
                triggerConditions: {
                  mode: 'all',
                  conditions: [{ ...condition, field, operator: getDefaultConditionOperator(field) }],
                },
              })
            }}>
              {fields.map((field) => (
                <option key={field.key} value={field.key}>{field.key}</option>
              ))}
            </FormSelect>
          </Field>
          <Field label="Operator">
            <FormSelect value={condition.operator} onChange={(event) => setDraft({ ...draft, triggerConditions: { mode: 'all', conditions: [{ ...condition, operator: event.target.value as typeof condition.operator }] } })}>
              {['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'not_in', 'contains', 'is_empty', 'is_not_empty'].map((operator) => (
                <option key={operator} value={operator}>{operator}</option>
              ))}
            </FormSelect>
          </Field>
          <Field label="Value">
            <FormInput
              placeholder={String(fieldExample.value)}
              value={String(condition.value ?? '')}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  triggerConditions: {
                    mode: 'all',
                    conditions: [
                      {
                        ...condition,
                        value: parseConditionValue(
                          event.target.value,
                          condition.field,
                          condition.operator,
                        ),
                      },
                    ],
                  },
                })
              }
            />
            <p className="text-xs text-[var(--muted-foreground)]">{fieldExample.label}</p>
          </Field>
        </div>
      )}
    </div>
  )
}

function ApprovalRules({ draft, setDraft }: { draft: WorkflowDraft; setDraft: (draft: WorkflowDraft) => void }) {
  const fields = getWorkflowModule(draft.template.moduleName)?.fields ?? []
  const defaultField = fields[0]?.key ?? 'amount'
  const defaultExample = getConditionFieldExample(defaultField)
  const defaultRule = draft.rules.find((rule) => rule.isFallback) ?? draft.rules[0]
  const updateRule = (index: number, rule: WorkflowRuleDraft) => {
    const rules = [...draft.rules]
    rules[index] = rule
    setDraft({ ...draft, rules })
  }
  return (
    <div className="space-y-4">
      {draft.rules.map((rule, index) => (
        <div key={index} className="rounded-md border border-[var(--border)] p-4">
          {(() => {
            const condition = rule.conditionJson?.conditions[0] ?? {
              field: defaultField,
              operator: getDefaultConditionOperator(defaultField),
              value: defaultExample.value,
            }
            const fieldExample = getConditionFieldExample(condition.field)

            return (
          <div className="grid gap-4 md:grid-cols-5">
            <Field label="Rule Name">
              <FormInput value={rule.name} onChange={(event) => updateRule(index, { ...rule, name: event.target.value })} />
            </Field>
            <Field label="Priority">
              <FormInput type="number" value={rule.priority} onChange={(event) => updateRule(index, { ...rule, priority: Number(event.target.value) })} />
            </Field>
            <Field label="Condition Field">
              <FormSelect
                value={condition.field}
                onChange={(event) => {
                  const field = event.target.value
                  const example = getConditionFieldExample(field)
                  updateRule(index, {
                    ...rule,
                    isFallback: false,
                    conditionJson: {
                      mode: 'all',
                      conditions: [
                        {
                          field,
                          operator: getDefaultConditionOperator(field),
                          value: example.value,
                        },
                      ],
                    },
                  })
                }}
              >
                {fields.map((field) => (
                  <option key={field.key} value={field.key}>{field.key}</option>
                ))}
              </FormSelect>
            </Field>
            <Field label="Condition Operator">
              <FormSelect
                value={condition.operator}
                onChange={(event) => {
                  const operator = event.target.value as typeof condition.operator
                  updateRule(index, {
                    ...rule,
                    isFallback: false,
                    conditionJson: {
                      mode: 'all',
                      conditions: [
                        {
                          ...condition,
                          operator,
                          value: parseConditionValue(
                            String(condition.value ?? ''),
                            condition.field,
                            operator,
                          ),
                        },
                      ],
                    },
                  })
                }}
              >
                {['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'not_in', 'contains', 'is_empty', 'is_not_empty'].map((operator) => (
                  <option key={operator} value={operator}>{operator}</option>
                ))}
              </FormSelect>
            </Field>
            <Field label="Condition Value">
              <FormInput
                placeholder={String(fieldExample.value)}
                value={String(condition.value ?? '')}
                onChange={(event) =>
                  updateRule(index, {
                    ...rule,
                    isFallback: false,
                    conditionJson: {
                      mode: 'all',
                      conditions: [
                        {
                          ...condition,
                          value: parseConditionValue(
                            event.target.value,
                            condition.field,
                            condition.operator,
                          ),
                        },
                      ],
                    },
                  })
                }
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                {fieldExample.label}. Use commas for between or list values.
              </p>
            </Field>
          </div>
            )
          })()}
          <div className="mt-3">
            <FormCheckbox
              label="Fallback rule"
              checked={rule.isFallback}
              onChange={(event) => updateRule(index, { ...rule, isFallback: event.target.checked })}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          setDraft({
            ...draft,
            rules: [
              ...draft.rules,
              {
                name: 'New approval rule',
                priority: draft.rules.length + 1,
                isFallback: false,
                isActive: true,
                conditionJson: {
                  mode: 'all',
                  conditions: [
                    {
                      field: defaultField,
                      operator: getDefaultConditionOperator(defaultField),
                      value: defaultExample.value,
                    },
                  ],
                },
                steps:
                  defaultRule?.steps.map((step, stepIndex) => ({
                    ...step,
                    stepOrder: stepIndex + 1,
                  })) ?? [],
                copiedFromDefaultPath: true,
              },
            ],
          })
        }
      >
        <Plus className="h-4 w-4" /> Add rule
      </Button>
    </div>
  )
}

const stepTypeOptions: Array<{
  value: WorkflowStepDraft['stepType']
  label: string
  description: string
}> = [
  {
    value: 'REVIEW',
    label: 'Review',
    description: 'Checks the request before an approval decision.',
  },
  {
    value: 'APPROVAL',
    label: 'Approval',
    description: 'Approves or rejects the business request.',
  },
  {
    value: 'FINANCE_CHECK',
    label: 'Finance check',
    description: 'Validates finance impact, budget, or payment readiness.',
  },
  {
    value: 'HR_CHECK',
    label: 'HR check',
    description: 'Validates HR policy, leave, or employee data.',
  },
  {
    value: 'MANAGEMENT_APPROVAL',
    label: 'Management approval',
    description: 'Routes the request to senior management.',
  },
  {
    value: 'FINAL_VERIFICATION',
    label: 'Final verification',
    description: 'Confirms final details before the workflow is completed.',
  },
]

const assigneeTypeOptions: Array<{
  value: WorkflowStepDraft['assigneeType']
  label: string
  description: string
}> = [
  {
    value: 'ROLE',
    label: 'Role queue',
    description: 'Any active user with the selected role can act on this step.',
  },
  {
    value: 'USER',
    label: 'Specific user',
    description: 'Only the selected user can act on this step.',
  },
  {
    value: 'REQUESTER_MANAGER',
    label: "Requester's manager",
    description: 'Resolved at runtime from the requester profile.',
  },
  {
    value: 'DEPARTMENT_HEAD',
    label: 'Department head',
    description: 'Resolved at runtime from the requester department.',
  },
  {
    value: 'CUSTOM_FIELD_USER',
    label: 'User from event field',
    description: 'Resolved from a user ID field in the event payload.',
  },
]

function optionDescription<TValue extends string>(
  options: Array<{ value: TValue; description: string }>,
  value: TValue,
) {
  return options.find((option) => option.value === value)?.description
}

function ApprovalSteps({
  draft,
  setDraft,
  users,
  usersLoading,
}: {
  draft: WorkflowDraft
  setDraft: (draft: WorkflowDraft) => void
  users: UserResponseDto[]
  usersLoading: boolean
}) {
  const userFields =
    getWorkflowModule(draft.template.moduleName)?.fields.filter(
      (field) => field.type === 'user',
    ) ?? []
  const updateRule = (index: number, rule: WorkflowRuleDraft) => {
    const rules = [...draft.rules]
    rules[index] = rule
    setDraft({ ...draft, rules })
  }
  const updateStep = (
    ruleIndex: number,
    stepIndex: number,
    step: WorkflowStepDraft,
  ) => {
    const rule = draft.rules[ruleIndex]
    const steps = [...rule.steps]
    steps[stepIndex] = step
    updateRule(ruleIndex, { ...rule, steps })
  }

  return (
    <div className="space-y-5">
      {draft.rules.map((rule, ruleIndex) => {
        const conditionText = rule.isFallback
          ? 'Fallback path when no earlier rule matches.'
          : rule.conditionJson?.conditions.length
            ? rule.conditionJson.conditions
                .map(
                  (condition) =>
                    `${condition.field} ${condition.operator} ${formatValue(
                      condition.value,
                    )}`,
                )
                .join(', ')
            : 'Needs rule condition.'

        return (
          <section
            key={ruleIndex}
            aria-label={`Rule ${ruleIndex + 1} ${rule.name || `Rule ${ruleIndex + 1}`}`}
            className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-2)]"
            role="group"
          >
            <div className="border-b border-[var(--border)] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Rule {ruleIndex + 1}
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-[var(--foreground)]">
                    {rule.name || `Rule ${ruleIndex + 1}`}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    This chain runs when this rule matches.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                    {conditionText}
                  </p>
                  {rule.copiedFromDefaultPath ? (
                    <p className="mt-1 text-xs font-medium text-[var(--brand-emphasis)]">
                      Started from the default approval path. Customize if this rule needs different approvers.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]">
                    Priority {rule.priority}
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]">
                    {rule.steps.length} steps
                  </span>
                  {rule.isFallback ? (
                    <span className="rounded-full border border-[var(--warning)] bg-[var(--warning-soft)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--warning)]">
                      Fallback
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="space-y-4 p-4">
              {rule.steps.map((step, stepIndex) => (
                <div
                  key={stepIndex}
                  className="rounded-md border border-[var(--border)] bg-white p-4"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                        Approval chain item {stepIndex + 1}
                      </p>
                      <h3 className="text-base font-semibold text-[var(--foreground)]">
                        {step.stepName || 'Unnamed workflow step'}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {describeWorkflowAssignee(step, users)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={
                          step.canReject
                            ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                            : 'bg-[var(--success-soft)] text-[var(--success)]'
                        }
                      >
                        {step.canReject ? 'Can reject' : 'Approve only'}
                      </Badge>
                      <Button
                        aria-label={`Remove approval step ${stepIndex + 1}`}
                        size="sm"
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          updateRule(ruleIndex, {
                            ...rule,
                            steps: rule.steps
                              .filter((_, index) => index !== stepIndex)
                              .map((item, index) => ({
                                ...item,
                                stepOrder: index + 1,
                              })),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Step name" description="Use a business name users will recognize in their task list.">
                    <FormInput
                      value={step.stepName}
                      onChange={(event) =>
                        updateStep(ruleIndex, stepIndex, {
                          ...step,
                          stepName: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field
                    label="Action type"
                    description={optionDescription(stepTypeOptions, step.stepType)}
                  >
                    <FormSelect
                      value={step.stepType}
                      onChange={(event) =>
                        updateStep(ruleIndex, stepIndex, {
                          ...step,
                          stepType: event.target.value as WorkflowStepDraft['stepType'],
                        })
                      }
                    >
                      {stepTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FormSelect>
                  </Field>
                  <Field
                    label="Who handles this step"
                    description={optionDescription(
                      assigneeTypeOptions,
                      step.assigneeType,
                    )}
                  >
                    <FormSelect
                      value={step.assigneeType}
                      onChange={(event) => {
                        const assigneeType = event.target
                          .value as WorkflowStepDraft['assigneeType']
                        updateStep(ruleIndex, stepIndex, {
                          ...step,
                          assigneeType,
                          assigneeRoleSlug:
                            assigneeType === 'ROLE' ? roleOptions[0] : undefined,
                          assigneeUserId: undefined,
                          assigneeFieldPath:
                            assigneeType === 'CUSTOM_FIELD_USER'
                              ? userFields[0]?.key
                              : undefined,
                        })
                      }}
                    >
                      {assigneeTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FormSelect>
                  </Field>
                  {step.assigneeType === 'ROLE' ? (
                    <Field label="Role queue" description="The task appears for users who have this role.">
                      <FormSelect
                        value={step.assigneeRoleSlug ?? ''}
                        onChange={(event) =>
                          updateStep(ruleIndex, stepIndex, {
                            ...step,
                            assigneeRoleSlug: event.target.value || undefined,
                            assigneeUserId: undefined,
                            assigneeFieldPath: undefined,
                          })
                        }
                      >
                        <option value="">Select role</option>
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {formatRoleLabel(role)}
                          </option>
                        ))}
                      </FormSelect>
                    </Field>
                  ) : null}
                  {step.assigneeType === 'USER' ? (
                    <Field label="Specific user" description="The task appears only for this person.">
                      <FormSelect
                        value={step.assigneeUserId ?? ''}
                        disabled={usersLoading}
                        onChange={(event) =>
                          updateStep(ruleIndex, stepIndex, {
                            ...step,
                            assigneeRoleSlug: undefined,
                            assigneeUserId: event.target.value || undefined,
                            assigneeFieldPath: undefined,
                          })
                        }
                      >
                        <option value="">
                          {usersLoading ? 'Loading users...' : 'Select user'}
                        </option>
                        {step.assigneeUserId &&
                        !users.some((user) => user.id === step.assigneeUserId) ? (
                          <option value={step.assigneeUserId}>
                            Selected user ID: {step.assigneeUserId}
                          </option>
                        ) : null}
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} &lt;{user.email}&gt;
                          </option>
                        ))}
                      </FormSelect>
                    </Field>
                  ) : null}
                  {step.assigneeType === 'CUSTOM_FIELD_USER' ? (
                    <Field
                      label="Event user field"
                      description="The event payload must contain a user ID at this field path."
                    >
                      <FormSelect
                        value={step.assigneeFieldPath ?? ''}
                        onChange={(event) =>
                          updateStep(ruleIndex, stepIndex, {
                            ...step,
                            assigneeRoleSlug: undefined,
                            assigneeUserId: undefined,
                            assigneeFieldPath: event.target.value || undefined,
                          })
                        }
                      >
                        <option value="">Select event user field</option>
                        {userFields.map((field) => (
                          <option key={field.key} value={field.key}>
                            {field.key}
                          </option>
                        ))}
                      </FormSelect>
                      {userFields.length === 0 ? (
                        <p className="mt-1 text-xs text-[var(--destructive)]">
                          This event has no user field configured for assignment.
                        </p>
                      ) : null}
                    </Field>
                  ) : null}
                  <Field label="SLA hours" description="How long this step should remain open before it is late.">
                    <FormInput
                      type="number"
                      min={1}
                      value={step.slaHours ?? ''}
                      onChange={(event) =>
                        updateStep(ruleIndex, stepIndex, {
                          ...step,
                          slaHours: Number(event.target.value) || undefined,
                        })
                      }
                    />
                  </Field>
                </div>
                <div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormCheckbox
                    label="Required step"
                    description="The workflow cannot finish without this step."
                    checked={step.isRequired}
                    onChange={(event) =>
                      updateStep(ruleIndex, stepIndex, {
                        ...step,
                        isRequired: event.target.checked,
                      })
                    }
                  />
                  <FormCheckbox
                    label="Requires comment"
                    description="Actor must write a note before action."
                    checked={step.requiresComment}
                    onChange={(event) =>
                      updateStep(ruleIndex, stepIndex, {
                        ...step,
                        requiresComment: event.target.checked,
                      })
                    }
                  />
                  <FormCheckbox
                    label="Requires attachment"
                    description="Actor must upload supporting evidence."
                    checked={step.requiresAttachment}
                    onChange={(event) =>
                      updateStep(ruleIndex, stepIndex, {
                        ...step,
                        requiresAttachment: event.target.checked,
                      })
                    }
                  />
                  <FormCheckbox
                    label="Can reject"
                    description="Actor may reject the whole workflow."
                    checked={step.canReject}
                    onChange={(event) =>
                      updateStep(ruleIndex, stepIndex, {
                        ...step,
                        canReject: event.target.checked,
                      })
                    }
                  />
                </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              className="mx-4 mb-4"
              variant="secondary"
              onClick={() =>
                updateRule(ruleIndex, {
                  ...rule,
                  steps: [
                    ...rule.steps,
                    {
                      stepOrder: rule.steps.length + 1,
                      stepName: 'Approval step',
                      stepType: 'APPROVAL',
                      assigneeType: 'ROLE',
                      assigneeRoleSlug: 'manager',
                      isRequired: true,
                      requiresComment: false,
                      requiresAttachment: false,
                      canReject: true,
                      canReassign: false,
                      slaHours: 24,
                    },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4" /> Add approval step
            </Button>
          </section>
        )
      })}
    </div>
  )
}

function WorkflowPreview({
  draft,
  users,
}: {
  draft: WorkflowDraft
  users: UserResponseDto[]
}) {
  const [expandedRules, setExpandedRules] = useState<Record<number, boolean>>({
    0: true,
  })
  const triggerSummary =
    draft.triggerMode === 'always'
      ? 'Runs for every matching event.'
      : draft.triggerConditions.conditions.length > 0
        ? draft.triggerConditions.conditions
            .map(
              (condition) =>
                `${condition.field} ${condition.operator} ${formatValue(condition.value)}`,
            )
            .join(', ')
        : 'Needs trigger condition.'

  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-4">
      <div className="border-b border-[var(--border)] pb-3">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
          Live workflow preview
        </p>
        <h2 className="mt-1 text-base font-semibold text-[var(--foreground)]">
          {draft.template.name || 'Untitled workflow'}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
          {draft.template.moduleName} / {draft.template.eventName}
        </p>
      </div>
      <div className="space-y-4 pt-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
            Trigger
          </p>
          <p className="mt-1 text-sm leading-5 text-[var(--ink-2)]">
            {triggerSummary}
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
            Approval paths
          </p>
          {draft.rules.map((rule, ruleIndex) => {
            const ruleName = rule.name || `Rule ${ruleIndex + 1}`
            const isExpanded = expandedRules[ruleIndex] ?? ruleIndex === 0
            const conditionText = rule.isFallback
              ? 'Fallback path when no earlier rule matches.'
              : rule.conditionJson?.conditions.length
                ? rule.conditionJson.conditions
                    .map(
                      (condition) =>
                        `${condition.field} ${condition.operator} ${formatValue(
                          condition.value,
                        )}`,
                    )
                    .join(', ')
                : 'Needs rule condition.'

            return (
              <div
                key={ruleIndex}
                className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-2)]"
              >
                <button
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${ruleName} approval path preview`}
                  className="flex w-full items-start justify-between gap-3 p-3 text-left transition hover:bg-white/70"
                  type="button"
                  onClick={() =>
                    setExpandedRules((current) => ({
                      ...current,
                      [ruleIndex]: !isExpanded,
                    }))
                  }
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        {ruleName}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]">
                        Priority {rule.priority}
                      </span>
                      {rule.isFallback ? (
                        <span className="rounded-full border border-[var(--warning)] bg-[var(--warning-soft)] px-2 py-1 font-mono text-[10px] text-[var(--warning)]">
                          Fallback
                        </span>
                      ) : null}
                    </div>
                    <span className="mt-1 block text-xs leading-5 text-[var(--muted-foreground)]">
                      {conditionText}
                    </span>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]">
                      {rule.steps.length} steps
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-[var(--ink-3)]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[var(--ink-3)]" />
                    )}
                  </span>
                </button>
                {isExpanded ? (
                  <div className="border-t border-[var(--border)] bg-white p-3">
                    <ol className="space-y-0">
                      {rule.steps.length > 0 ? (
                        rule.steps.map((item, stepIndex) => {
                          const assigneeText = describeWorkflowAssignee(item, users)
                          const needsAssignment = assigneeText === 'Needs assignment'
                          const stepTypeLabel =
                            stepTypeOptions.find(
                              (option) => option.value === item.stepType,
                            )?.label ?? item.stepType
                          const isLastStep = stepIndex === rule.steps.length - 1

                          return (
                            <li
                              key={stepIndex}
                              className="grid grid-cols-[32px_1fr] gap-3"
                            >
                              <div className="flex flex-col items-center">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--primary)] bg-[var(--primary)] font-mono text-[10px] font-semibold text-white">
                                  {stepIndex + 1}
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
                                        Step {stepIndex + 1}
                                      </p>
                                      <h4 className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                                        {item.stepName || 'Unnamed step'}
                                      </h4>
                                      <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                                        {stepTypeLabel} -{' '}
                                        <span
                                          className={
                                            needsAssignment
                                              ? 'font-semibold text-[var(--destructive)]'
                                              : ''
                                          }
                                        >
                                          {assigneeText}
                                        </span>
                                      </p>
                                    </div>
                                    <Badge
                                      className={
                                        item.canReject
                                          ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                                          : 'bg-[var(--success-soft)] text-[var(--success)]'
                                      }
                                    >
                                      {item.canReject ? 'Can reject' : 'Approve only'}
                                    </Badge>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {item.slaHours ? (
                                      <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]">
                                        SLA {item.slaHours}h
                                      </span>
                                    ) : null}
                                    {item.requiresComment ? (
                                      <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]">
                                        Comment required
                                      </span>
                                    ) : null}
                                    {item.requiresAttachment ? (
                                      <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]">
                                        Attachment required
                                      </span>
                                    ) : null}
                                    {item.canReassign ? (
                                      <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]">
                                        Reassign allowed
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </li>
                          )
                        })
                      ) : (
                        <li className="text-sm text-[var(--destructive)]">
                          Add at least one approval-chain item for this rule.
                        </li>
                      )}
                    </ol>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Outcomes({
  draft,
  setDraft,
}: {
  draft: WorkflowDraft
  setDraft: (draft: WorkflowDraft) => void
}) {
  const isExpenseWorkflow = draft.template.moduleName === 'expenses'

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Approved status">
        <FormInput value={String(draft.approvedActionsJson.setStatus ?? '')} onChange={(event) => setDraft({ ...draft, approvedActionsJson: { ...draft.approvedActionsJson, setStatus: event.target.value } })} />
      </Field>
      <Field label="Rejected status">
        <FormInput value={String(draft.rejectedActionsJson.setStatus ?? '')} onChange={(event) => setDraft({ ...draft, rejectedActionsJson: { ...draft.rejectedActionsJson, setStatus: event.target.value } })} />
      </Field>
      {isExpenseWorkflow ? (
        <FormCheckbox
          label="Create payment request after expense approval"
          checked={Boolean(draft.approvedActionsJson.createPaymentRequest)}
          onChange={(event) => setDraft({ ...draft, approvedActionsJson: { ...draft.approvedActionsJson, createPaymentRequest: event.target.checked } })}
        />
      ) : null}
    </div>
  )
}

function ReviewWorkflow({ draft }: { draft: WorkflowDraft }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-md bg-[#17201c] p-4 text-xs leading-6 text-white">
      {JSON.stringify(toWorkflowWizardPayload(draft), null, 2)}
    </pre>
  )
}

function Field({
  label,
  children,
  description,
}: {
  label: string
  children: React.ReactNode
  description?: string
}) {
  return (
    <FormField label={label} description={description}>
      {children}
    </FormField>
  )
}

export function WorkflowTemplateDetailPage() {
  const { templateId } = useParams({ strict: false }) as { templateId: string }
  const query = useWorkflowTemplateControllerFindOne({ id: templateId })
  const template = unwrapData(query.data)

  return (
    <>
      <PageHeader
        title={template?.name ?? 'Workflow detail'}
        kicker="Template detail"
        description="Read-only workflow execution summary."
      />
      <ErrorNotice error={query.error} />
      {template ? <WorkflowTemplateDetail template={template} /> : null}
    </>
  )
}

function WorkflowTemplateDetail({
  template,
}: {
  template: WorkflowTemplateResponseDto
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
                <WorkflowRuleCard key={rule.id} rule={rule} />
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

function SectionHeading({ label, title }: { label: string; title: string }) {
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

function SummaryValue({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-[var(--foreground)]">
        {value}
      </p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
      {message}
    </p>
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

function WorkflowRuleCard({ rule }: { rule: WorkflowApprovalRuleResponseDto }) {
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
      <ApprovalStepTimeline steps={sortedSteps} />
    </article>
  )
}

function ApprovalStepTimeline({
  steps,
}: {
  steps: WorkflowApprovalStepConfigResponseDto[]
}) {
  if (steps.length === 0) {
    return <EmptyState message="No approval steps configured." />
  }

  return (
    <ol className="mt-4 space-y-0">
      {steps.map((step, index) => {
        const flags = stepFlags(step)
        const isLastStep = index === steps.length - 1
        const slaHours = numberFromObjectField(step.slaHours)

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
                      {describeStepAssignee(step)}
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

export function WorkflowInstanceDetailPage() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const query = useWorkflowRuntimeControllerFindOne({ id: instanceId })
  const logs = useAuditLogsControllerListForWorkflow({ workflowInstanceId: instanceId, params: { page: 1, limit: 50 } })
  const instance = unwrapData(query.data) as Row | undefined
  const steps = ((instance?.steps as Row[] | undefined) ?? []).sort((a, b) => Number(a.stepOrder) - Number(b.stepOrder))
  return (
    <>
      <PageHeader title={`Workflow ${instanceId}`} kicker="Runtime detail" />
      <ErrorNotice error={query.error} />
      {instance ? <ObjectPanel value={instance} /> : null}
      <section className="mt-6">
        <PageHeader title="Approval timeline" kicker="Steps" />
        <TaskTable rows={steps} />
      </section>
      <section className="mt-6">
        <PageHeader title="Audit history" kicker="Logs" />
        <AuditTable rows={(unwrapData(logs.data) as Row[] | undefined) ?? []} />
      </section>
    </>
  )
}

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
    { header: 'Step', accessorKey: 'stepName' },
    { header: 'Type', accessorKey: 'stepType' },
    {
      header: 'Assignee',
      cell: ({ row }) => {
        const original = row.original
        const assignedRoleSlug =
          'assignedRoleSlug' in original ? original.assignedRoleSlug : undefined
        const assignedUserId =
          'assignedUserId' in original ? original.assignedUserId : undefined
        return formatValue(assignedRoleSlug ?? assignedUserId ?? original.assigneeType)
      },
    },
    { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
    { header: 'Activated', cell: ({ row }) => formatDate(row.original.activatedAt) },
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

export function ExpensesPage() {
  const user = useAuthStore((state) => state.user)
  const query = useExpensesControllerList({ params: { page: 1, limit: 50 } })
  const submit = useExpensesControllerSubmit({ mutation: { onSuccess: () => void query.refetch() } })
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
      <ErrorNotice error={query.error} />
      <DataTable
        data={rows}
        columns={[
          { header: 'Title', accessorKey: 'title' },
          { header: 'Amount', cell: ({ row }) => `${formatValue(row.original.amount)} ${formatValue(row.original.currency)}` },
          { header: 'Category', accessorKey: 'category' },
          { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
          {
            header: 'Actions',
            cell: ({ row }) => (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
                  to="/expenses/$expenseId"
                  params={{ expenseId: String(row.original.id) }}
                >
                  <Eye className="h-4 w-4" />
                  Open
                </Link>
                {canWriteExpenses ? (
                  <Button
                    className="whitespace-nowrap border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                    size="sm"
                    type="button"
                    onClick={() => submit.mutate({ id: String(row.original.id) })}
                  >
                    <Send className="h-4 w-4" />
                    Submit
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />
    </>
  )
}

const expenseCategoryOptions = ['Travel', 'Meal', 'Office Supplies', 'Software']
const expenseVendorOptions = ['Star Tech', 'Pathao', 'Daraz', 'Ryans Computers', 'Foodpanda']

export function ExpenseCreatePage() {
  const navigate = useNavigate()
  const createExpense = useExpensesControllerCreate({ mutation: { onSuccess: async () => navigate({ to: '/expenses' }) } })
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: expenseCategoryOptions[0],
    description: '',
    currency: 'BDT',
    vendor: expenseVendorOptions[0],
  })
  const expensePayload: CreateExpenseDto = {
    title: form.title,
    amount: Number(form.amount),
    category: form.category,
    currency: form.currency,
    description: form.description || undefined,
    vendor: form.vendor || undefined,
  }

  return (
    <div className="max-w-3xl">
      <CreatePanel
        title="New expense"
        kicker="Expense request"
        description="Capture request details, vendor context, and notes before submitting for approval."
        error={createExpense.error}
        onSubmit={() => createExpense.mutate({ data: expensePayload })}
        submitLabel={createExpense.isPending ? 'Saving...' : 'Save expense'}
      >
        <FormSection index="01" title="Expense details" hint="Required for approval routing.">
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Title" htmlFor="expense-title">
              <FormInput
                id="expense-title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </FormField>
            <FormField label="Amount" htmlFor="expense-amount">
              <FormInput
                id="expense-amount"
                type="number"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
              />
            </FormField>
            <FormField label="Currency" htmlFor="expense-currency">
              <FormInput
                id="expense-currency"
                value={form.currency}
                onChange={(event) => setForm({ ...form, currency: event.target.value })}
              />
            </FormField>
          </div>
        </FormSection>
        <FormSection index="02" title="Vendor and category">
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Category" htmlFor="expense-category">
              <FormSelect
                id="expense-category"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                {expenseCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </FormSelect>
            </FormField>
            <FormField label="Vendor" htmlFor="expense-vendor">
              <FormSelect
                id="expense-vendor"
                value={form.vendor}
                onChange={(event) => setForm({ ...form, vendor: event.target.value })}
              >
                {expenseVendorOptions.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </FormSelect>
            </FormField>
          </div>
        </FormSection>
        <FormSection index="03" title="Notes">
          <FormField label="Description" htmlFor="expense-description">
            <FormTextarea
              id="expense-description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </FormField>
        </FormSection>
      </CreatePanel>
    </div>
  )
}

export function ExpenseDetailPage() {
  const { expenseId } = useParams({ strict: false }) as { expenseId: string }
  const query = useExpensesControllerFindOne({ id: expenseId })
  const expense = unwrapData(query.data) as Row | undefined
  return <DetailPage title={`Expense ${expenseId}`} error={query.error} value={expense} workflowId={String(expense?.workflowInstanceId ?? '')} />
}

export function LeavesPage() {
  const user = useAuthStore((state) => state.user)
  const query = useLeavesControllerList({ params: { page: 1, limit: 50 } })
  const submit = useLeavesControllerSubmit({ mutation: { onSuccess: () => void query.refetch() } })
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
      <ErrorNotice error={query.error} />
      <DataTable
        data={rows}
        columns={[
          { header: 'Type', accessorKey: 'leaveType' },
          { header: 'Days', accessorKey: 'leaveDays' },
          { header: 'Period', cell: ({ row }) => `${formatValue(row.original.startDate)} - ${formatValue(row.original.endDate)}` },
          { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
          { header: 'Actions', cell: ({ row }) => <div className="flex gap-2"><Link className="font-medium text-[var(--primary)]" to="/leaves/$leaveId" params={{ leaveId: String(row.original.id) }}>Open</Link>{canWriteLeaves ? <Button size="sm" variant="secondary" type="button" onClick={() => submit.mutate({ id: String(row.original.id) })}><Send className="h-4 w-4" /> Submit</Button> : null}</div> },
        ]}
      />
    </>
  )
}

export function LeaveCreatePage() {
  const navigate = useNavigate()
  const createLeave = useLeavesControllerCreate({ mutation: { onSuccess: async () => navigate({ to: '/leaves' }) } })
  const [form, setForm] = useState({ leaveType: 'ANNUAL', leaveDays: 1, startDate: '', endDate: '', reason: '' })
  const leavePayload: CreateLeaveDto = {
    leaveType: form.leaveType,
    leaveDays: form.leaveDays,
    startDate: form.startDate,
    endDate: form.endDate,
    reason: form.reason ? { text: form.reason } : undefined,
  }

  return (
    <div className="max-w-3xl">
      <CreatePanel
        title="New leave"
        kicker="Leave request"
        description="Capture leave type, dates, duration, and reason before sending through workflow."
        error={createLeave.error}
        onSubmit={() => createLeave.mutate({ data: leavePayload })}
        submitLabel={createLeave.isPending ? 'Saving...' : 'Save leave'}
      >
        <FormSection index="01" title="Leave type">
          <FormField label="Type">
            <FormSelect
              value={form.leaveType}
              onChange={(event) => setForm({ ...form, leaveType: event.target.value })}
            >
              <option value="ANNUAL">Annual</option>
              <option value="SICK">Sick</option>
              <option value="CASUAL">Casual</option>
              <option value="UNPAID">Unpaid</option>
            </FormSelect>
          </FormField>
        </FormSection>
        <FormSection index="02" title="Dates and duration">
          <div className="grid gap-3 md:grid-cols-3">
            <FormField label="Start date">
              <FormInput
                type="date"
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              />
            </FormField>
            <FormField label="End date">
              <FormInput
                type="date"
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </FormField>
            <FormField label="Leave days">
              <FormInput
                type="number"
                value={form.leaveDays}
                onChange={(event) => setForm({ ...form, leaveDays: Number(event.target.value) })}
              />
            </FormField>
          </div>
        </FormSection>
        <FormSection index="03" title="Reason">
          <FormField label="Reason">
            <FormTextarea
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
            />
          </FormField>
        </FormSection>
      </CreatePanel>
    </div>
  )
}

export function LeaveDetailPage() {
  const { leaveId } = useParams({ strict: false }) as { leaveId: string }
  const query = useLeavesControllerFindOne({ id: leaveId })
  const leave = unwrapData(query.data) as Row | undefined
  return <DetailPage title={`Leave ${leaveId}`} error={query.error} value={leave} workflowId={String(leave?.workflowInstanceId ?? '')} />
}

export function PaymentsPage() {
  const user = useAuthStore((state) => state.user)
  const query = usePaymentsControllerList({ params: { page: 1, limit: 50 } })
  const markPaid = usePaymentsControllerMarkPaid({ mutation: { onSuccess: () => void query.refetch() } })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  const canWritePayments = hasPermission(
    user?.roles ?? [],
    user?.permissions ?? [],
    'payments.write',
  )
  const columns: ColumnDef<Row>[] = [
    { header: 'Payment', accessorKey: 'id' },
    { header: 'Expense', accessorKey: 'expenseId' },
    { header: 'Amount', cell: ({ row }) => `${formatValue(row.original.amount)} ${formatValue(row.original.currency)}` },
    { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
  ]

  if (canWritePayments) {
    columns.push({
      header: 'Action',
      cell: ({ row }) => <Button size="sm" type="button" onClick={() => markPaid.mutate({ id: String(row.original.id), data: { paymentReference: `MANUAL-${Date.now()}` } })}>Mark paid</Button>,
    })
  }

  return (
    <>
      <PageHeader title="Payment requests" kicker="Accounts" />
      <ErrorNotice error={query.error} />
      <DataTable
        data={rows}
        columns={columns}
      />
    </>
  )
}

export function AuditLogsPage() {
  const query = useAuditLogsControllerList({ params: { page: 1, limit: 50 } })
  return (
    <>
      <PageHeader title="Audit logs" kicker="History" />
      <ErrorNotice error={query.error} />
      <AuditTable rows={(unwrapData(query.data) as Row[] | undefined) ?? []} />
    </>
  )
}

function AuditTable({ rows }: { rows: Row[] }) {
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

function DetailPage({ title, error, value, workflowId }: { title: string; error: unknown; value?: Row; workflowId?: string }) {
  return (
    <>
      <PageHeader title={title} action={workflowId ? <Button type="button" variant="secondary"><Link to="/workflow-instances/$instanceId" params={{ instanceId: workflowId }}>Workflow history</Link></Button> : null} />
      <ErrorNotice error={error} />
      {value ? <ObjectPanel value={value} /> : null}
    </>
  )
}

function ObjectPanel({ value }: { value: Row }) {
  return (
    <div className="grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm md:grid-cols-2">
      {Object.entries(value).map(([key, item]) => (
        <div key={key} className="min-w-0 border-b border-[var(--border)] pb-2">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">{key}</p>
          <p className="mt-1 break-words text-sm">{formatValue(item)}</p>
        </div>
      ))}
    </div>
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

function CreatePanel({
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

export function ResetBuilderStatePage() {
  useWorkflowBuilderStore.getState().setDraft(createDefaultWorkflowDraft())
  return <WorkflowBuilderPage />
}
