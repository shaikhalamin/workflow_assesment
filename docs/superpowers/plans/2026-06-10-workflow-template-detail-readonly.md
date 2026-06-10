# Workflow Template Detail Read-Only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `WorkflowTemplateDetailPage` raw object rendering with a compact read-only business explanation of trigger, rule paths, approval steps, outcomes, and low-priority technical metadata.

**Architecture:** Keep the change local to `src/pages/workspace-pages.tsx` because the spec applies only to this page and the existing app keeps workspace page views in that file. Add small local narrowing/formatting helpers near the detail page to interpret generated `object` JSON fields without `any`, then render normal React/Tailwind cards and timelines using existing `Badge`, `PageHeader`, `formatDate`, `formatValue`, `formatRoleLabel`, and assignee language. Add one focused test file for the detail page with mocked API data.

**Tech Stack:** React 19, TypeScript, TanStack Router/Query generated hooks, Vitest, Testing Library, Tailwind utility classes, existing app CSS variables.

---

## File Structure

- Modify: `src/pages/workspace-pages.tsx`
  - Add type imports for workflow template/rule/step response DTOs.
  - Add local read-only detail helpers for condition groups, condition text, outcome action maps, step assignees, step flags, labels, and safe primitive extraction from generated `object` fields.
  - Replace `WorkflowTemplateDetailPage`'s `ObjectPanel` usage with the read-only business layout.
  - Keep `ObjectPanel` for other detail pages.
- Create: `src/pages/workspace-pages.workflow-template-detail.test.tsx`
  - Mock router/API hooks.
  - Render representative templates.
  - Assert plain-language trigger, sorted rules, readable assignees, business outcomes, and absence of raw nested JSON.

## Task 1: Add Failing Detail Page Tests

**Files:**
- Create: `src/pages/workspace-pages.workflow-template-detail.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { WorkflowTemplateDetailPage } from './workspace-pages'

let templateResponse: unknown | undefined

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
    to,
  }: {
    children: ReactNode
    className?: string
    to?: string
  }) => (
    <a href={to ?? '#'} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useParams: () => ({ templateId: 'template-1' }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}))

vi.mock('@/lib/api/gen', () => ({
  useAuditLogsControllerList: () => ({ data: { data: [] }, error: null }),
  useAuditLogsControllerListForWorkflow: () => ({
    data: { data: [] },
    error: null,
  }),
  useDashboardControllerAccounts: () => ({ data: undefined }),
  useDashboardControllerAdmin: () => ({ data: undefined }),
  useDashboardControllerApprover: () => ({ data: undefined }),
  useDashboardControllerEmployee: () => ({ data: undefined }),
  useDashboardControllerHr: () => ({ data: undefined }),
  useExpensesControllerCreate: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
  useExpensesControllerFindOne: () => ({ data: undefined, error: null }),
  useExpensesControllerList: () => ({ data: { data: [] }, error: null }),
  useExpensesControllerSubmit: () => ({ mutate: vi.fn() }),
  useLeavesControllerCreate: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
  useLeavesControllerFindOne: () => ({ data: undefined, error: null }),
  useLeavesControllerList: () => ({ data: { data: [] }, error: null }),
  useLeavesControllerSubmit: () => ({ mutate: vi.fn() }),
  usePaymentsControllerList: () => ({ data: { data: [] }, error: null }),
  usePaymentsControllerMarkPaid: () => ({ mutate: vi.fn() }),
  useUsersControllerGetUsers: () => ({ data: { data: [] }, isLoading: false }),
  useWorkflowEventSchemaControllerCreate: () => ({
    error: null,
    mutate: vi.fn(),
  }),
  useWorkflowEventSchemaControllerList: () => ({
    data: { data: [] },
    error: null,
    refetch: vi.fn(),
  }),
  useWorkflowRuntimeControllerApprove: () => ({ mutate: vi.fn() }),
  useWorkflowRuntimeControllerFindOne: () => ({ data: undefined }),
  useWorkflowRuntimeControllerList: () => ({ data: { data: [] }, error: null }),
  useWorkflowRuntimeControllerMyPending: () => ({
    data: { data: [] },
    error: null,
  }),
  useWorkflowRuntimeControllerReject: () => ({ mutate: vi.fn() }),
  useWorkflowTemplateControllerCreateWizard: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
  useWorkflowTemplateControllerDeactivate: () => ({ mutate: vi.fn() }),
  useWorkflowTemplateControllerDuplicate: () => ({ mutate: vi.fn() }),
  useWorkflowTemplateControllerFindOne: () => ({
    data: templateResponse ? { data: templateResponse } : undefined,
    error: null,
  }),
  useWorkflowTemplateControllerList: () => ({ data: { data: [] }, error: null }),
  useWorkflowTemplateControllerPublish: () => ({ mutate: vi.fn() }),
}))

const baseTemplate = {
  id: 'template-1',
  name: 'Expense approval workflow',
  description: null,
  moduleName: 'expenses',
  eventName: 'expense.submitted',
  entityType: 'Expense',
  status: 'DRAFT',
  priority: 5,
  effectiveFrom: '2026-06-01',
  effectiveTo: '2026-12-31',
  allowResubmission: true,
  createdById: 'user-admin',
  triggerCondition: {
    id: 'trigger-1',
    workflowTemplateId: 'template-1',
    conditionJson: {
      mode: 'all',
      conditions: [
        { field: 'amount', operator: 'gte', value: 2000 },
        { field: 'category', operator: 'eq', value: 'travel' },
      ],
    },
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-01T09:00:00.000Z',
  },
  rules: [
    {
      id: 'rule-2',
      workflowTemplateId: 'template-1',
      name: 'Fallback approval',
      priority: 2,
      conditionJson: null,
      isFallback: true,
      isActive: false,
      steps: [],
      createdAt: '2026-06-01T09:00:00.000Z',
      updatedAt: '2026-06-02T09:00:00.000Z',
    },
    {
      id: 'rule-1',
      workflowTemplateId: 'template-1',
      name: 'Amount Over 2000',
      priority: 1,
      conditionJson: {
        mode: 'all',
        conditions: [{ field: 'amount', operator: 'gte', value: 2000 }],
      },
      isFallback: false,
      isActive: true,
      steps: [
        {
          id: 'step-1',
          workflowApprovalRuleId: 'rule-1',
          stepOrder: 1,
          stepName: 'Finance review',
          stepType: 'FINANCE_CHECK',
          assigneeType: 'ROLE',
          assigneeRoleSlug: 'finance-admin',
          assigneeUserId: null,
          assigneeFieldPath: null,
          isRequired: true,
          requiresComment: true,
          requiresAttachment: false,
          canReject: true,
          canReassign: false,
          slaHours: 24,
          escalationAssigneeType: null,
          escalationAssigneeRoleSlug: null,
          escalationAssigneeUserId: null,
          createdAt: '2026-06-01T09:00:00.000Z',
          updatedAt: '2026-06-01T09:00:00.000Z',
        },
        {
          id: 'step-2',
          workflowApprovalRuleId: 'rule-1',
          stepOrder: 2,
          stepName: 'Budget owner approval',
          stepType: 'APPROVAL',
          assigneeType: 'CUSTOM_FIELD_USER',
          assigneeRoleSlug: null,
          assigneeUserId: null,
          assigneeFieldPath: 'customFields.budgetOwnerId',
          isRequired: true,
          requiresComment: false,
          requiresAttachment: true,
          canReject: true,
          canReassign: true,
          slaHours: null,
          escalationAssigneeType: null,
          escalationAssigneeRoleSlug: null,
          escalationAssigneeUserId: null,
          createdAt: '2026-06-01T09:00:00.000Z',
          updatedAt: '2026-06-01T09:00:00.000Z',
        },
      ],
      createdAt: '2026-06-01T09:00:00.000Z',
      updatedAt: '2026-06-01T09:00:00.000Z',
    },
  ],
  outcomeConfig: {
    id: 'outcome-1',
    workflowTemplateId: 'template-1',
    approvedActionsJson: {
      setStatus: 'APPROVED',
      notifyRequester: true,
      createPaymentRequest: true,
      auditCode: 'EXPENSE_APPROVED',
    },
    rejectedActionsJson: {
      setStatus: 'REJECTED',
      requireReason: true,
      allowResubmission: true,
    },
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-01T09:00:00.000Z',
  },
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-02T09:00:00.000Z',
}

describe('WorkflowTemplateDetailPage', () => {
  it('renders a business-readable trigger with condition chips', () => {
    templateResponse = baseTemplate

    render(<WorkflowTemplateDetailPage />)

    expect(screen.getByText('Runs when all trigger conditions match:')).toBeInTheDocument()
    expect(screen.getAllByText('amount >= 2000').length).toBeGreaterThan(0)
    expect(screen.getByText('category equals travel')).toBeInTheDocument()
  })

  it('renders trigger without conditions as runs for every event', () => {
    templateResponse = {
      ...baseTemplate,
      triggerCondition: {
        ...baseTemplate.triggerCondition,
        conditionJson: { mode: 'all', conditions: [] },
      },
    }

    render(<WorkflowTemplateDetailPage />)

    expect(screen.getByText('Runs for every expense.submitted event.')).toBeInTheDocument()
  })

  it('sorts rules by priority and renders readable approval assignees', () => {
    templateResponse = baseTemplate

    render(<WorkflowTemplateDetailPage />)

    const priorityOneRule = screen.getByRole('heading', {
      level: 3,
      name: 'Amount Over 2000',
    })
    const priorityTwoRule = screen.getByRole('heading', {
      level: 3,
      name: 'Fallback approval',
    })
    expect(
      priorityOneRule.compareDocumentPosition(priorityTwoRule) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(screen.getByText('Role: Finance Admin')).toBeInTheDocument()
    expect(
      screen.getByText('User from event field: customFields.budgetOwnerId'),
    ).toBeInTheDocument()
    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(screen.getByText('Comment required')).toBeInTheDocument()
    expect(screen.getByText('Attachment required')).toBeInTheDocument()
    expect(screen.getByText('Reassign allowed')).toBeInTheDocument()
  })

  it('renders approved and rejected outcomes as business actions', () => {
    templateResponse = baseTemplate

    render(<WorkflowTemplateDetailPage />)

    const approved = screen.getByRole('region', { name: /approved outcome/i })
    expect(within(approved).getByText('Set status to APPROVED')).toBeInTheDocument()
    expect(within(approved).getByText('Notify requester')).toBeInTheDocument()
    expect(within(approved).getByText('Create payment request')).toBeInTheDocument()
    expect(within(approved).getByText('Audit code')).toBeInTheDocument()
    expect(within(approved).getByText('EXPENSE_APPROVED')).toBeInTheDocument()

    const rejected = screen.getByRole('region', { name: /rejected outcome/i })
    expect(within(rejected).getByText('Set status to REJECTED')).toBeInTheDocument()
    expect(within(rejected).getByText('Require rejection reason')).toBeInTheDocument()
    expect(within(rejected).getByText('Allow resubmission')).toBeInTheDocument()
  })

  it('does not render raw nested JSON for trigger, rules, steps, or outcomes', () => {
    templateResponse = baseTemplate

    const { container } = render(<WorkflowTemplateDetailPage />)

    expect(container.textContent).not.toContain('conditionJson')
    expect(container.textContent).not.toContain('approvedActionsJson')
    expect(container.textContent).not.toContain('rejectedActionsJson')
    expect(container.textContent).not.toContain('{"mode"')
    expect(container.textContent).not.toContain('"steps"')
  })
})
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
npm test -- src/pages/workspace-pages.workflow-template-detail.test.tsx
```

Expected: FAIL because the current page renders `ObjectPanel` and does not show text such as `Runs when all trigger conditions match:`.

- [ ] **Step 3: Commit the failing test**

```bash
git add src/pages/workspace-pages.workflow-template-detail.test.tsx
git commit -m "test: cover workflow template detail read-only view"
```

## Task 2: Add Local Detail Formatting Helpers

**Files:**
- Modify: `src/pages/workspace-pages.tsx`

- [ ] **Step 1: Extend generated type imports**

Change the existing generated type import near the top of `src/pages/workspace-pages.tsx` from:

```tsx
import type {
  CreateExpenseDto,
  CreateLeaveDto,
  UserResponseDto,
  WorkflowStepResponseDto,
} from '@/lib/api/gen'
```

to:

```tsx
import type {
  CreateExpenseDto,
  CreateLeaveDto,
  UserResponseDto,
  WorkflowApprovalRuleResponseDto,
  WorkflowApprovalStepConfigResponseDto,
  WorkflowStepResponseDto,
  WorkflowTemplateResponseDto,
} from '@/lib/api/gen'
```

- [ ] **Step 2: Add local helper types and narrowers after `type Row = Record<string, unknown>`**

```tsx
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

function conditionValueFromUnknown(value: unknown): DetailConditionValue | undefined {
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

function conditionGroupFromUnknown(value: unknown): DetailConditionGroup | undefined {
  if (!isRecord(value)) return undefined
  const mode = value.mode === 'any' ? 'any' : 'all'
  if (!Array.isArray(value.conditions)) return undefined

  const conditions = value.conditions
    .map((item): DetailCondition | undefined => {
      if (!isRecord(item) || typeof item.field !== 'string' || typeof item.operator !== 'string') {
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

function outcomeActionsFromUnknown(value: unknown): Record<string, OutcomeActionValue> {
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
```

- [ ] **Step 3: Add readable label and summary helpers after those narrowers**

```tsx
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
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatConditionValue(value: DetailConditionValue | undefined) {
  if (Array.isArray(value)) return value.join(', ')
  return formatValue(value)
}

function describeCondition(condition: DetailCondition) {
  const operator = conditionOperatorLabels[condition.operator] ?? condition.operator
  if (condition.operator === 'is_empty' || condition.operator === 'is_not_empty') {
    return `${condition.field} ${operator}`
  }

  return `${condition.field} ${operator} ${formatConditionValue(condition.value)}`
}

function describeConditionGroup(group: DetailConditionGroup | undefined) {
  if (!group || group.conditions.length === 0) return 'No conditions configured.'
  const prefix =
    group.mode === 'any'
      ? 'Any condition can match'
      : 'All conditions must match'
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
```

- [ ] **Step 4: Run typecheck for helper errors**

Run:

```bash
npm run typecheck
```

Expected: PASS for the helper-only change.

## Task 3: Replace the Detail Page with Read-Only Business Layout

**Files:**
- Modify: `src/pages/workspace-pages.tsx`

- [ ] **Step 1: Replace `WorkflowTemplateDetailPage` implementation**

Replace the current `WorkflowTemplateDetailPage` function with:

```tsx
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
```

- [ ] **Step 2: Add the summary/detail components immediately after `WorkflowTemplateDetailPage`**

```tsx
function WorkflowTemplateDetail({
  template,
}: {
  template: WorkflowTemplateResponseDto
}) {
  const sortedRules = [...template.rules].sort((first, second) => first.priority - second.priority)
  const totalSteps = sortedRules.reduce((total, rule) => total + rule.steps.length, 0)
  const triggerGroup = conditionGroupFromUnknown(template.triggerCondition?.conditionJson)
  const approvedActions = outcomeActionsFromUnknown(template.outcomeConfig?.approvedActionsJson)
  const rejectedActions = outcomeActionsFromUnknown(template.outcomeConfig?.rejectedActionsJson)

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
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
            <h2 className="mt-3 text-lg font-semibold tracking-tight text-[var(--foreground)]">
              {template.name}
            </h2>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryValue label="Entity type" value={template.entityType} />
          <SummaryValue
            label="Effective dates"
            value={`${formatDate(template.effectiveFrom)} to ${formatDate(template.effectiveTo)}`}
          />
          <SummaryValue
            label="Resubmission"
            value={template.allowResubmission ? 'Allowed' : 'Not allowed'}
          />
          <SummaryValue label="Rules" value={String(template.rules.length)} />
          <SummaryValue label="Approval steps" value={String(totalSteps)} />
          <SummaryValue label="Last updated" value={formatDate(template.updatedAt)} />
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
        <SectionHeading label="Trigger" title="When this workflow runs" />
        <WorkflowTriggerSummary eventName={template.eventName} group={triggerGroup} />
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
        <SectionHeading label="Workflow flow" title="Execution path" />
        <WorkflowFlow eventName={template.eventName} rules={sortedRules} />
      </section>

      <section className="space-y-3">
        <SectionHeading label="Rules and approval steps" title="Approval paths by priority" />
        {sortedRules.length > 0 ? (
          sortedRules.map((rule) => <WorkflowRuleCard key={rule.id} rule={rule} />)
        ) : (
          <EmptyState message="No approval rules configured." />
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading label="Outcomes" title="After a decision" />
        <div className="grid gap-3 lg:grid-cols-2">
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
```

- [ ] **Step 3: Add small presentational components after `WorkflowTemplateDetail`**

```tsx
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

function SummaryValue({ label, value }: { label: string; value: React.ReactNode }) {
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
```

- [ ] **Step 4: Run the detail page test**

Run:

```bash
npm test -- src/pages/workspace-pages.workflow-template-detail.test.tsx
```

Expected: FAIL with missing component references until Task 4 adds `WorkflowTriggerSummary`, `WorkflowFlow`, `WorkflowRuleCard`, and `OutcomeCard`.

## Task 4: Add Trigger, Flow, Rule, Step, and Outcome Components

**Files:**
- Modify: `src/pages/workspace-pages.tsx`

- [ ] **Step 1: Add trigger and flow components after `EmptyState`**

```tsx
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
        Runs when {group.mode === 'any' ? 'any trigger condition matches:' : 'all trigger conditions match:'}
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

function WorkflowFlow({
  eventName,
  rules,
}: {
  eventName: string
  rules: WorkflowApprovalRuleResponseDto[]
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
          Trigger
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
          {eventName}
        </p>
      </div>
      <div className="ml-4 h-6 w-px bg-[var(--border)]" />
      <div className="rounded-md border border-[var(--border)] bg-[var(--brand-soft)] p-3 text-sm font-medium text-[var(--brand-emphasis)]">
        Evaluate approval rules by priority
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {rules.length > 0 ? (
          rules.map((rule) => (
            <div key={rule.id} className="rounded-md border border-[var(--border)] bg-white p-3">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
                Priority {rule.priority} rule
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                {rule.name}
              </p>
              <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
                {rule.steps.length > 0
                  ? [...rule.steps]
                      .sort((first, second) => first.stepOrder - second.stepOrder)
                      .map((step) => `Step ${step.stepOrder}`)
                      .join(' -> ')
                  : 'No approval steps configured.'}
              </p>
            </div>
          ))
        ) : (
          <EmptyState message="No approval rules configured." />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add rule card and approval timeline components**

```tsx
function WorkflowRuleCard({ rule }: { rule: WorkflowApprovalRuleResponseDto }) {
  const sortedSteps = [...rule.steps].sort((first, second) => first.stepOrder - second.stepOrder)

  return (
    <article className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
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
                      {stepTypeLabels[step.stepType] ?? step.stepType} - {describeStepAssignee(step)}
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
```

- [ ] **Step 3: Add outcome card component**

```tsx
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
      className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm"
      role="region"
    >
      <h3 className="text-base font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      {hasActions ? (
        <div className="mt-3 space-y-2 text-sm text-[var(--ink-2)]">
          <p>{typeof status === 'string' ? `Set status to ${status}` : statusFallback}</p>
          {!rejected && actions.notifyRequester === true ? <p>Notify requester</p> : null}
          {!rejected && actions.createPaymentRequest === true ? (
            <p>Create payment request</p>
          ) : null}
          {rejected && (actions.requireReason === true || actions.requiresRejectionReason === true) ? (
            <p>Require rejection reason</p>
          ) : null}
          {rejected && actions.allowResubmission === true ? <p>Allow resubmission</p> : null}
          {extraRows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3 border-t border-[var(--border)] pt-2">
              <span className="text-[var(--muted-foreground)]">{row.label}</span>
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
```

- [ ] **Step 4: Run the detail page test**

Run:

```bash
npm test -- src/pages/workspace-pages.workflow-template-detail.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the implementation**

```bash
git add src/pages/workspace-pages.tsx
git commit -m "feat: add read-only workflow template detail"
```

## Task 5: Final Verification and Small Fixes

**Files:**
- Modify if needed: `src/pages/workspace-pages.tsx`
- Modify if needed: `src/pages/workspace-pages.workflow-template-detail.test.tsx`

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- src/pages/workspace-pages.workflow-template-detail.test.tsx src/pages/workspace-pages.workflow-builder.test.tsx src/features/workflows/workflow-builder.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS. If TypeScript reports a generated-hook mock or DTO shape mismatch in the new test, fix the mock/template fixture with precise generated DTO types, not `any` or non-null assertions.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS. Fix every ESLint issue in code; do not add inline disables or modify ESLint config.

- [ ] **Step 5: Inspect the final diff**

Run:

```bash
git diff -- src/pages/workspace-pages.tsx src/pages/workspace-pages.workflow-template-detail.test.tsx
```

Expected:
- `WorkflowTemplateDetailPage` no longer renders `ObjectPanel`.
- No generated files are edited.
- No `any`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, eslint-disable comments, or non-null assertions are introduced.
- The page remains read-only with no edit/publish/duplicate/deactivate actions.

- [ ] **Step 6: Commit verification fixes if any were needed**

If Step 1 through Step 4 required changes, run:

```bash
git add src/pages/workspace-pages.tsx src/pages/workspace-pages.workflow-template-detail.test.tsx
git commit -m "fix: tighten workflow template detail rendering"
```

If no changes were needed after the implementation commit, skip this commit.

## Self-Review

Spec coverage:
- Template summary: covered in Task 3 via header badges and summary grid.
- Trigger plain language and condition chips: covered in Task 4 via `WorkflowTriggerSummary`.
- Workflow flow without a graph library: covered in Task 4 via `WorkflowFlow`.
- Rule cards sorted by priority: covered in Task 3 sorting and Task 4 `WorkflowRuleCard`.
- Approval step timeline with readable assignees and enabled-only flags: covered in Task 4.
- Outcomes with approved/rejected business actions and extra key/value rows: covered in Task 4 `OutcomeCard`.
- Technical metadata at bottom with template-level IDs only: covered in Task 3.
- Graceful malformed/unknown nested data: covered by `conditionGroupFromUnknown`, `outcomeActionsFromUnknown`, and empty states in Tasks 2 through 4.
- Testing requirements: covered in Task 1 and Task 5.

Placeholder scan:
- The plan contains no placeholder implementation steps and no generated-file edits.

Type consistency:
- DTO names match generated files found in `src/lib/api/gen/types`.
- Helpers use `unknown`/narrowing and generated DTO types; no `any` is introduced.
