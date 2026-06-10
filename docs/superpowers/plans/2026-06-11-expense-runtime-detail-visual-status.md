# Expense Runtime Detail Visual Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw object rendering on expense detail and workflow runtime detail with compact readable workflow status, responsibility, step history, and assigned approver actions.

**Architecture:** Keep the change inside `src/pages/workspace-pages.tsx` because the existing workspace pages and detail helpers already live there, and the spec explicitly asks for the existing page structure. Add small local narrowing helpers for generated `object | null` fields, then render business sections with the existing `PageHeader`, `SectionHeading`, `SummaryValue`, `EmptyState`, `Badge`, `Button`, `FormInput`, and `FormTextarea` patterns. Add focused Vitest/Testing Library page tests with mocked generated API hooks and auth store state.

**Tech Stack:** React 19, TypeScript, TanStack Router, TanStack Query generated hooks, Zustand auth store, Vitest, Testing Library, Tailwind utility classes, existing app CSS variables.

---

## File Structure

- Modify: `src/pages/workspace-pages.tsx`
  - Add type imports for `ExpenseResponseDto`, `WorkflowActionResponseDto`, and `WorkflowInstanceResponseDto`.
  - Add local helper functions near the existing detail helpers for primitive extraction, readable metadata rows, runtime assignee text, responsibility summaries, step status copy, and action permission checks.
  - Replace `WorkflowInstanceDetailPage` raw `ObjectPanel` rendering with workflow-first summary, current responsibility, ordered timeline, assigned action panel, readable action history, audit table, and technical reference.
  - Replace `ExpenseDetailPage` raw `DetailPage` usage with expense summary, custom fields, embedded workflow progress, optional full workflow link, and technical reference.
  - Keep `DetailPage` and `ObjectPanel` unchanged for `LeaveDetailPage`.
- Create: `src/pages/workspace-pages.workflow-runtime-detail.test.tsx`
  - Mock router/query/API hooks.
  - Assert ordered runtime steps, active and next responsibility, assigned user/role action access, unassigned hiding, mutation payloads, and absence of raw nested JSON.
- Create: `src/pages/workspace-pages.expense-detail.test.tsx`
  - Mock router/query/API hooks.
  - Assert business expense fields, custom fields, embedded workflow progress when `workflowInstanceId` exists, no-workflow empty state, and absence of raw nested JSON.

## Task 1: Add Failing Workflow Runtime Detail Tests

**Files:**
- Create: `src/pages/workspace-pages.workflow-runtime-detail.test.tsx`

- [ ] **Step 1: Create the runtime detail test file**

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthUserDto } from '@/lib/api/gen'
import { useAuthStore } from '@/stores/auth-store'

import { WorkflowInstanceDetailPage } from './workspace-pages'

let approveStep = vi.fn()
let rejectStep = vi.fn()
let invalidateQueries = vi.fn()
let workflowResponse: unknown | undefined

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
  useParams: () => ({ instanceId: 'wf-1' }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries,
  }),
}))

vi.mock('@/lib/api/gen', () => ({
  useAuditLogsControllerList: () => ({ data: { data: [] }, error: null }),
  useAuditLogsControllerListForWorkflow: () => ({
    data: {
      data: [
        {
          id: 'audit-1',
          action: 'WORKFLOW_UPDATED',
          entityType: 'WorkflowInstance',
          entityId: 'wf-1',
          oldStatus: 'ACTIVE',
          newStatus: 'APPROVED',
          comment: 'Completed',
          createdAt: '2026-06-11T10:00:00.000Z',
        },
      ],
    },
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
  useWorkflowRuntimeControllerApprove: () => ({
    error: null,
    isPending: false,
    mutate: approveStep,
  }),
  useWorkflowRuntimeControllerFindOne: () => ({
    data: workflowResponse ? { data: workflowResponse } : undefined,
    error: null,
  }),
  useWorkflowRuntimeControllerList: () => ({ data: { data: [] }, error: null }),
  useWorkflowRuntimeControllerMyPending: () => ({
    data: { data: [] },
    error: null,
  }),
  useWorkflowRuntimeControllerReject: () => ({
    error: null,
    isPending: false,
    mutate: rejectStep,
  }),
  useWorkflowTemplateControllerCreateWizard: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
  useWorkflowTemplateControllerDeactivate: () => ({ mutate: vi.fn() }),
  useWorkflowTemplateControllerDuplicate: () => ({ mutate: vi.fn() }),
  useWorkflowTemplateControllerFindOne: () => ({ data: undefined }),
  useWorkflowTemplateControllerList: () => ({ data: { data: [] }, error: null }),
  useWorkflowTemplateControllerPublish: () => ({ mutate: vi.fn() }),
}))

const assignedUser: AuthUserDto = {
  id: 'user-active',
  name: 'Active Approver',
  email: 'active@example.com',
  roles: ['employee'],
  permissions: [],
}

const financeUser: AuthUserDto = {
  id: 'finance-1',
  name: 'Finance Approver',
  email: 'finance@example.com',
  roles: ['finance-admin'],
  permissions: [],
}

const unassignedUser: AuthUserDto = {
  id: 'other-user',
  name: 'Other User',
  email: 'other@example.com',
  roles: ['employee'],
  permissions: [],
}

const baseWorkflow = {
  id: 'wf-1',
  workflowTemplateId: 'template-1',
  workflowApprovalRuleId: 'rule-1',
  moduleName: 'expenses',
  eventName: 'expense.submitted',
  entityType: 'Expense',
  entityId: 'expense-1',
  requesterId: 'requester-1',
  departmentId: 'finance',
  status: 'ACTIVE',
  metadataJson: {
    title: 'Laptop reimbursement',
    amount: 4500,
    nested: { ignored: true },
  },
  startedAt: '2026-06-11T08:00:00.000Z',
  completedAt: null,
  rejectedAt: null,
  steps: [
    {
      id: 'step-3',
      workflowInstanceId: 'wf-1',
      stepOrder: 3,
      stepName: 'Accounts payment check',
      stepType: 'FINAL_VERIFICATION',
      assignedUserId: null,
      assignedRoleSlug: 'accounts-admin',
      assigneeType: 'ROLE',
      status: 'WAITING',
      activatedAt: null,
      actedAt: null,
      actionByUserId: null,
      comment: null,
      rejectionReason: null,
      actions: [],
      createdAt: '2026-06-11T08:00:00.000Z',
      updatedAt: '2026-06-11T08:00:00.000Z',
    },
    {
      id: 'step-1',
      workflowInstanceId: 'wf-1',
      stepOrder: 1,
      stepName: 'Manager review',
      stepType: 'APPROVAL',
      assignedUserId: 'manager-1',
      assignedRoleSlug: null,
      assigneeType: 'USER',
      status: 'APPROVED',
      activatedAt: '2026-06-11T08:00:00.000Z',
      actedAt: '2026-06-11T08:20:00.000Z',
      actionByUserId: 'manager-1',
      comment: 'Looks correct',
      rejectionReason: null,
      actions: [
        {
          id: 'action-1',
          workflowInstanceId: 'wf-1',
          workflowStepId: 'step-1',
          action: 'APPROVED',
          actorUserId: 'manager-1',
          comment: 'Looks correct',
          reason: null,
          metadataJson: null,
          createdAt: '2026-06-11T08:20:00.000Z',
        },
      ],
      createdAt: '2026-06-11T08:00:00.000Z',
      updatedAt: '2026-06-11T08:20:00.000Z',
    },
    {
      id: 'step-2',
      workflowInstanceId: 'wf-1',
      stepOrder: 2,
      stepName: 'Finance approval',
      stepType: 'FINANCE_CHECK',
      assignedUserId: 'user-active',
      assignedRoleSlug: null,
      assigneeType: 'USER',
      status: 'ACTIVE',
      activatedAt: '2026-06-11T08:21:00.000Z',
      actedAt: null,
      actionByUserId: null,
      comment: null,
      rejectionReason: null,
      actions: [
        {
          id: 'action-2',
          workflowInstanceId: 'wf-1',
          workflowStepId: 'step-2',
          action: 'STEP_ACTIVATED',
          actorUserId: null,
          comment: 'Ready for finance',
          reason: null,
          metadataJson: null,
          createdAt: '2026-06-11T08:21:00.000Z',
        },
      ],
      createdAt: '2026-06-11T08:00:00.000Z',
      updatedAt: '2026-06-11T08:21:00.000Z',
    },
  ],
  actions: [
    {
      id: 'action-workflow-1',
      workflowInstanceId: 'wf-1',
      workflowStepId: null,
      action: 'TRIGGERED',
      actorUserId: 'requester-1',
      comment: 'Submitted expense',
      reason: null,
      metadataJson: null,
      createdAt: '2026-06-11T08:00:00.000Z',
    },
  ],
  createdAt: '2026-06-11T08:00:00.000Z',
  updatedAt: '2026-06-11T08:21:00.000Z',
}

describe('WorkflowInstanceDetailPage', () => {
  beforeEach(() => {
    approveStep = vi.fn()
    rejectStep = vi.fn()
    invalidateQueries = vi.fn()
    workflowResponse = baseWorkflow
    useAuthStore.setState({ isAuthenticated: true, user: assignedUser })
    localStorage.clear()
  })

  it('renders ordered readable workflow progress and responsibility summaries', () => {
    const { container } = render(<WorkflowInstanceDetailPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Workflow wf-1' })).toBeInTheDocument()
    expect(screen.getByText('Current responsibility')).toBeInTheDocument()
    expect(screen.getByText('Finance approval')).toBeInTheDocument()
    expect(screen.getByText('User ID: user-active')).toBeInTheDocument()
    expect(screen.getByText('Next responsibility')).toBeInTheDocument()
    expect(screen.getByText('Accounts payment check')).toBeInTheDocument()

    const timeline = screen.getByRole('region', { name: /workflow progress/i })
    const stepOne = within(timeline).getByText('Manager review')
    const stepTwo = within(timeline).getByText('Finance approval')
    const stepThree = within(timeline).getByText('Accounts payment check')
    expect(stepOne.compareDocumentPosition(stepTwo) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(stepTwo.compareDocumentPosition(stepThree) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(within(timeline).getByText('Completed successfully')).toBeInTheDocument()
    expect(within(timeline).getByText('Currently waiting for action')).toBeInTheDocument()
    expect(within(timeline).getByText('Upcoming step')).toBeInTheDocument()
    expect(within(timeline).getByText('Looks correct')).toBeInTheDocument()
    expect(within(timeline).getByText('Ready for finance')).toBeInTheDocument()
    expect(container.textContent).not.toContain('"steps"')
    expect(container.textContent).not.toContain('metadataJson')
    expect(container.textContent).not.toContain('{"nested"')
  })

  it('lets a directly assigned active user approve and reject from the detail page', () => {
    render(<WorkflowInstanceDetailPage />)

    const panel = screen.getByRole('region', { name: /approval decision/i })
    fireEvent.change(within(panel).getByRole('textbox', { name: /comment or rejection reason/i }), {
      target: { value: 'Approved from detail' },
    })
    fireEvent.click(within(panel).getByRole('button', { name: /approve/i }))
    fireEvent.click(within(panel).getByRole('button', { name: /reject/i }))

    expect(approveStep).toHaveBeenCalledWith({
      id: 'step-2',
      data: { comment: 'Approved from detail' },
    })
    expect(rejectStep).toHaveBeenCalledWith({
      id: 'step-2',
      data: { reason: 'Approved from detail' },
    })
  })

  it('lets a matching role approver act on the active step', () => {
    workflowResponse = {
      ...baseWorkflow,
      steps: baseWorkflow.steps.map((step) =>
        step.id === 'step-2'
          ? {
              ...step,
              assignedUserId: null,
              assignedRoleSlug: 'finance-admin',
              assigneeType: 'ROLE',
            }
          : step,
      ),
    }
    useAuthStore.setState({ isAuthenticated: true, user: financeUser })

    render(<WorkflowInstanceDetailPage />)

    expect(
      screen.getByRole('region', { name: /approval decision/i }),
    ).toBeInTheDocument()
  })

  it('hides approve and reject controls from unassigned users', () => {
    useAuthStore.setState({ isAuthenticated: true, user: unassignedUser })

    render(<WorkflowInstanceDetailPage />)

    expect(screen.getByText('Current responsibility')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /approval decision/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the new runtime tests and verify they fail**

Run: `npm test -- src/pages/workspace-pages.workflow-runtime-detail.test.tsx`

Expected: FAIL because `WorkflowInstanceDetailPage` still renders `ObjectPanel`, does not expose the workflow progress region, and does not show the detail-page approval panel.

- [ ] **Step 3: Commit the failing tests**

```bash
git add src/pages/workspace-pages.workflow-runtime-detail.test.tsx
git commit -m "test: cover workflow runtime detail status view"
```

## Task 2: Add Failing Expense Detail Tests

**Files:**
- Create: `src/pages/workspace-pages.expense-detail.test.tsx`

- [ ] **Step 1: Create the expense detail test file**

```tsx
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExpenseDetailPage } from './workspace-pages'

let expenseResponse: unknown | undefined
let workflowResponse: unknown | undefined

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
  useParams: () => ({ expenseId: 'expense-1' }),
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
  useExpensesControllerFindOne: () => ({
    data: expenseResponse ? { data: expenseResponse } : undefined,
    error: null,
  }),
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
  useWorkflowRuntimeControllerApprove: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
  useWorkflowRuntimeControllerFindOne: ({ id }: { id: string }) => ({
    data: id && workflowResponse ? { data: workflowResponse } : undefined,
    error: null,
  }),
  useWorkflowRuntimeControllerList: () => ({ data: { data: [] }, error: null }),
  useWorkflowRuntimeControllerMyPending: () => ({
    data: { data: [] },
    error: null,
  }),
  useWorkflowRuntimeControllerReject: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
  useWorkflowTemplateControllerCreateWizard: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
  useWorkflowTemplateControllerDeactivate: () => ({ mutate: vi.fn() }),
  useWorkflowTemplateControllerDuplicate: () => ({ mutate: vi.fn() }),
  useWorkflowTemplateControllerFindOne: () => ({ data: undefined }),
  useWorkflowTemplateControllerList: () => ({ data: { data: [] }, error: null }),
  useWorkflowTemplateControllerPublish: () => ({ mutate: vi.fn() }),
}))

const baseExpense = {
  id: 'expense-1',
  requesterId: 'requester-1',
  departmentId: 'finance',
  title: 'Laptop reimbursement',
  description: 'Replacement laptop for field work',
  amount: '4500',
  currency: 'BDT',
  category: 'Software',
  vendor: 'Star Tech',
  itemValue: 'Laptop',
  price: '4500',
  quantity: 1,
  status: 'UNDER_REVIEW',
  workflowInstanceId: 'wf-1',
  rejectionReason: null,
  customFieldsJson: {
    budgetOwner: 'Finance',
    projectCode: 'OPS-2026',
    nested: { hidden: true },
  },
  submittedAt: '2026-06-11T08:00:00.000Z',
  approvedAt: null,
  rejectedAt: null,
  paidAt: null,
  createdAt: '2026-06-10T08:00:00.000Z',
  updatedAt: '2026-06-11T08:00:00.000Z',
}

const baseWorkflow = {
  id: 'wf-1',
  workflowTemplateId: 'template-1',
  workflowApprovalRuleId: 'rule-1',
  moduleName: 'expenses',
  eventName: 'expense.submitted',
  entityType: 'Expense',
  entityId: 'expense-1',
  requesterId: 'requester-1',
  departmentId: 'finance',
  status: 'ACTIVE',
  metadataJson: { title: 'Laptop reimbursement' },
  startedAt: '2026-06-11T08:00:00.000Z',
  completedAt: null,
  rejectedAt: null,
  steps: [
    {
      id: 'step-1',
      workflowInstanceId: 'wf-1',
      stepOrder: 1,
      stepName: 'Manager review',
      stepType: 'APPROVAL',
      assignedUserId: 'manager-1',
      assignedRoleSlug: null,
      assigneeType: 'USER',
      status: 'APPROVED',
      activatedAt: '2026-06-11T08:00:00.000Z',
      actedAt: '2026-06-11T08:20:00.000Z',
      actionByUserId: 'manager-1',
      comment: 'Approved',
      rejectionReason: null,
      actions: [],
      createdAt: '2026-06-11T08:00:00.000Z',
      updatedAt: '2026-06-11T08:20:00.000Z',
    },
    {
      id: 'step-2',
      workflowInstanceId: 'wf-1',
      stepOrder: 2,
      stepName: 'Finance approval',
      stepType: 'FINANCE_CHECK',
      assignedUserId: null,
      assignedRoleSlug: 'finance-admin',
      assigneeType: 'ROLE',
      status: 'ACTIVE',
      activatedAt: '2026-06-11T08:21:00.000Z',
      actedAt: null,
      actionByUserId: null,
      comment: null,
      rejectionReason: null,
      actions: [],
      createdAt: '2026-06-11T08:00:00.000Z',
      updatedAt: '2026-06-11T08:21:00.000Z',
    },
  ],
  actions: [],
  createdAt: '2026-06-11T08:00:00.000Z',
  updatedAt: '2026-06-11T08:21:00.000Z',
}

describe('ExpenseDetailPage', () => {
  beforeEach(() => {
    expenseResponse = baseExpense
    workflowResponse = baseWorkflow
  })

  it('renders business expense fields and custom fields without raw object JSON', () => {
    const { container } = render(<ExpenseDetailPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Laptop reimbursement' })).toBeInTheDocument()
    expect(screen.getByText('4500 BDT')).toBeInTheDocument()
    expect(screen.getByText('Software')).toBeInTheDocument()
    expect(screen.getByText('Star Tech')).toBeInTheDocument()
    expect(screen.getByText('Replacement laptop for field work')).toBeInTheDocument()
    expect(screen.getByText('Budget owner')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
    expect(screen.getByText('Project code')).toBeInTheDocument()
    expect(screen.getByText('OPS-2026')).toBeInTheDocument()
    expect(container.textContent).not.toContain('customFieldsJson')
    expect(container.textContent).not.toContain('{"budgetOwner"')
    expect(container.textContent).not.toContain('"nested"')
  })

  it('embeds workflow progress and links to the full runtime detail', () => {
    render(<ExpenseDetailPage />)

    const workflow = screen.getByRole('region', { name: /workflow progress/i })
    expect(within(workflow).getByText('Manager review')).toBeInTheDocument()
    expect(within(workflow).getByText('Finance approval')).toBeInTheDocument()
    expect(within(workflow).getByText('Current responsibility')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /full workflow detail/i })).toHaveAttribute(
      'href',
      '/workflow-instances/$instanceId',
    )
  })

  it('shows an empty state when no workflow was started', () => {
    expenseResponse = {
      ...baseExpense,
      workflowInstanceId: null,
      customFieldsJson: null,
    }
    workflowResponse = undefined

    render(<ExpenseDetailPage />)

    expect(screen.getByText('No custom fields recorded.')).toBeInTheDocument()
    expect(screen.getByText('No workflow has been started for this expense.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /full workflow detail/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the new expense tests and verify they fail**

Run: `npm test -- src/pages/workspace-pages.expense-detail.test.tsx`

Expected: FAIL because `ExpenseDetailPage` still renders `DetailPage`/`ObjectPanel`, does not render a custom fields section, and does not embed workflow progress.

- [ ] **Step 3: Commit the failing tests**

```bash
git add src/pages/workspace-pages.expense-detail.test.tsx
git commit -m "test: cover expense detail workflow view"
```

## Task 3: Add Runtime Detail Helpers

**Files:**
- Modify: `src/pages/workspace-pages.tsx`

- [ ] **Step 1: Extend generated type imports**

Add these names to the existing `import type { ... } from '@/lib/api/gen'` block:

```tsx
  ExpenseResponseDto,
  WorkflowActionResponseDto,
  WorkflowInstanceResponseDto,
```

- [ ] **Step 2: Add helper types and functions after `stepTypeLabels`**

```tsx
type ReadableRow = {
  label: string
  value: React.ReactNode
}

type RuntimeStepStatus = WorkflowStepResponseDto['status']

const runtimeStepStatusText: Record<RuntimeStepStatus, string> = {
  APPROVED: 'Completed successfully',
  REJECTED: 'Stopped at this step',
  ACTIVE: 'Currently waiting for action',
  WAITING: 'Upcoming step',
  SKIPPED: 'Skipped',
}

function primitiveFromObjectField(value: unknown) {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  return undefined
}

function readableValue(value: unknown) {
  const primitive = primitiveFromObjectField(value)
  if (primitive !== undefined) return formatValue(primitive)
  return undefined
}

function dateFromObjectField(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function readableRowsFromRecord(value: unknown): ReadableRow[] {
  if (!isRecord(value)) return []

  return Object.entries(value)
    .map(([key, item]) => {
      const formatted = readableValue(item)
      return formatted
        ? {
            label: humanizeKey(key),
            value: formatted,
          }
        : undefined
    })
    .filter((row): row is ReadableRow => Boolean(row))
}

function workflowIdFromExpense(expense: ExpenseResponseDto) {
  const workflowId = stringFromObjectField(expense.workflowInstanceId)
  return workflowId ?? undefined
}

function formatOptionalDate(value: unknown) {
  return formatDate(dateFromObjectField(value))
}

function describeRuntimeAssignee(step: WorkflowStepResponseDto) {
  if (step.assigneeType === 'ROLE') {
    const role = stringFromObjectField(step.assignedRoleSlug)
    return role ? `Role: ${formatRoleLabel(role)}` : 'Role assignment pending'
  }

  if (step.assigneeType === 'USER') {
    const userId = stringFromObjectField(step.assignedUserId)
    return userId ? `User ID: ${userId}` : 'User assignment pending'
  }

  if (step.assigneeType === 'REQUESTER_MANAGER') {
    const assignedUserId = stringFromObjectField(step.assignedUserId)
    return assignedUserId
      ? `Requester manager: ${assignedUserId}`
      : "Requester's manager"
  }

  if (step.assigneeType === 'DEPARTMENT_HEAD') {
    const assignedUserId = stringFromObjectField(step.assignedUserId)
    return assignedUserId ? `Department head: ${assignedUserId}` : 'Department head'
  }

  const assignedUserId = stringFromObjectField(step.assignedUserId)
  return assignedUserId
    ? `Custom field user: ${assignedUserId}`
    : 'User from custom field'
}

function canActOnStep(step: WorkflowStepResponseDto | undefined, userRoles: string[], userId?: string) {
  if (!step || step.status !== 'ACTIVE' || !userId) return false

  if (step.assigneeType === 'USER') {
    return stringFromObjectField(step.assignedUserId) === userId
  }

  if (step.assigneeType === 'ROLE') {
    const role = stringFromObjectField(step.assignedRoleSlug)
    return Boolean(role && userRoles.includes(role))
  }

  return stringFromObjectField(step.assignedUserId) === userId
}

function getSortedRuntimeSteps(instance: WorkflowInstanceResponseDto) {
  return [...instance.steps].sort(
    (first, second) => first.stepOrder - second.stepOrder,
  )
}
```

- [ ] **Step 3: Run typecheck and confirm helper names/types are valid**

Run: `npm run typecheck`

Expected: PASS for the new helpers. If it fails because `WorkflowStepResponseDto['status']` or imported type names differ, correct the type import names from `src/lib/api/gen/types/*.ts` and rerun.

- [ ] **Step 4: Commit helper setup**

```bash
git add src/pages/workspace-pages.tsx
git commit -m "feat: add workflow detail formatting helpers"
```

## Task 4: Implement Shared Workflow Progress UI and Action Panel

**Files:**
- Modify: `src/pages/workspace-pages.tsx`

- [ ] **Step 1: Add workflow progress components before `WorkflowInstanceDetailPage`**

```tsx
function WorkflowProgressSection({
  instance,
  showActions = false,
}: {
  instance: WorkflowInstanceResponseDto
  showActions?: boolean
}) {
  const user = useAuthStore((state) => state.user)
  const steps = getSortedRuntimeSteps(instance)
  const activeStep = steps.find((step) => step.status === 'ACTIVE')
  const nextWaitingStep = steps.find((step) => step.status === 'WAITING')

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
          fallback="No waiting steps."
        />
      </div>
      <RuntimeStepTimeline steps={steps} />
      {showActions && canActOnStep(activeStep, user?.roles ?? [], user?.id) ? (
        <WorkflowDecisionPanel step={activeStep} workflowInstanceId={instance.id} />
      ) : null}
    </section>
  )
}

function ResponsibilitySummary({
  title,
  instance,
  step,
  fallback,
}: {
  title: string
  instance: WorkflowInstanceResponseDto
  step: WorkflowStepResponseDto | undefined
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
            {step.stepName || 'Unnamed step'}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
            {describeRuntimeAssignee(step)}
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
  const rejectedStep = instance.steps.find((step) => step.status === 'REJECTED')
  return rejectedStep
    ? `Rejected at ${rejectedStep.stepName || 'unnamed step'}.`
    : 'Workflow rejected.'
}

function RuntimeStepTimeline({ steps }: { steps: WorkflowStepResponseDto[] }) {
  if (steps.length === 0) {
    return <EmptyState message="No approval steps recorded." />
  }

  return (
    <ol className="mt-4 space-y-0">
      {steps.map((step, index) => {
        const isLastStep = index === steps.length - 1
        const tone =
          step.status === 'ACTIVE'
            ? 'border-l-blue-600 bg-blue-50'
            : step.status === 'APPROVED'
              ? 'border-l-emerald-600 bg-white'
              : step.status === 'REJECTED'
                ? 'border-l-red-600 bg-red-50'
                : 'border-l-slate-300 bg-[var(--surface-2)]'

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
                      {step.stepName || 'Unnamed step'}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      {stepTypeLabels[step.stepType] ?? step.stepType}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      {describeRuntimeAssignee(step)}
                    </p>
                  </div>
                  <Badge>{step.status}</Badge>
                </div>
                <p className="mt-2 text-xs font-medium text-[var(--ink-2)]">
                  {runtimeStepStatusText[step.status]}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryValue label="Activated" value={formatOptionalDate(step.activatedAt)} />
                  <SummaryValue label="Acted" value={formatOptionalDate(step.actedAt)} />
                  <SummaryValue label="Actor" value={formatValue(readableValue(step.actionByUserId))} />
                  <SummaryValue label="Assignee type" value={humanizeKey(step.assigneeType)} />
                </div>
                {readableValue(step.comment) ? (
                  <p className="mt-3 text-sm text-[var(--ink-2)]">
                    Comment: {readableValue(step.comment)}
                  </p>
                ) : null}
                {readableValue(step.rejectionReason) ? (
                  <p className="mt-3 text-sm text-red-700">
                    Rejection reason: {readableValue(step.rejectionReason)}
                  </p>
                ) : null}
                <StepActionHistory actions={step.actions} />
              </article>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function StepActionHistory({ actions }: { actions: WorkflowActionResponseDto[] }) {
  if (actions.length === 0) return null

  return (
    <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
        Step actions
      </p>
      {actions.map((action) => (
        <div key={action.id} className="grid gap-1 rounded-md bg-white px-3 py-2 text-xs text-[var(--ink-2)] sm:grid-cols-4">
          <span className="font-semibold text-[var(--foreground)]">{humanizeKey(action.action)}</span>
          <span>Actor: {formatValue(readableValue(action.actorUserId))}</span>
          <span>{formatDate(action.createdAt)}</span>
          <span>{readableValue(action.comment) ?? readableValue(action.reason) ?? '-'}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Add the decision panel after `StepActionHistory`**

```tsx
function WorkflowDecisionPanel({
  step,
  workflowInstanceId,
}: {
  step: WorkflowStepResponseDto
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
      className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4"
      role="region"
    >
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
        Current approver action
      </p>
      <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
        {step.stepName || 'Active step'}
      </h3>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {describeRuntimeAssignee(step)}
      </p>
      <div className="mt-3">
        <FormField label="Comment or rejection reason">
          <FormTextarea
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
```

- [ ] **Step 3: Run the runtime tests**

Run: `npm test -- src/pages/workspace-pages.workflow-runtime-detail.test.tsx`

Expected: Still FAIL until `WorkflowInstanceDetailPage` uses `WorkflowProgressSection`, but TypeScript should compile for the added components.

- [ ] **Step 4: Commit shared runtime UI**

```bash
git add src/pages/workspace-pages.tsx
git commit -m "feat: add workflow progress detail components"
```

## Task 5: Replace Workflow Runtime Detail Rendering

**Files:**
- Modify: `src/pages/workspace-pages.tsx`

- [ ] **Step 1: Replace `WorkflowInstanceDetailPage` with typed runtime rendering**

```tsx
export function WorkflowInstanceDetailPage() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const query = useWorkflowRuntimeControllerFindOne({ id: instanceId })
  const logs = useAuditLogsControllerListForWorkflow({
    workflowInstanceId: instanceId,
    params: { page: 1, limit: 50 },
  })
  const instance = unwrapData(query.data) as WorkflowInstanceResponseDto | undefined

  return (
    <>
      <PageHeader title={`Workflow ${instanceId}`} kicker="Runtime detail" />
      <ErrorNotice error={query.error} />
      {instance ? (
        <div className="space-y-5">
          <WorkflowInstanceSummary instance={instance} />
          <WorkflowProgressSection instance={instance} showActions />
          <WorkflowActionHistory actions={instance.actions} />
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
```

- [ ] **Step 2: Add runtime summary, action history, and technical reference components before `TasksPage`**

```tsx
function WorkflowInstanceSummary({
  instance,
}: {
  instance: WorkflowInstanceResponseDto
}) {
  const metadataRows = readableRowsFromRecord(instance.metadataJson)

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
        <SummaryValue label="Entity" value={`${instance.entityType} ${instance.entityId}`} />
        <SummaryValue label="Started" value={formatOptionalDate(instance.startedAt)} />
        <SummaryValue label="Completed" value={formatOptionalDate(instance.completedAt)} />
        <SummaryValue label="Rejected" value={formatOptionalDate(instance.rejectedAt)} />
        <SummaryValue label="Requester" value={instance.requesterId} />
        <SummaryValue label="Department" value={formatValue(readableValue(instance.departmentId))} />
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
              {actions.map((action) => (
                <tr key={action.id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-4 py-3 text-[13px]">{humanizeKey(action.action)}</td>
                  <td className="px-4 py-3 text-[13px]">{formatValue(readableValue(action.actorUserId))}</td>
                  <td className="px-4 py-3 text-[13px]">
                    {readableValue(action.comment) ?? readableValue(action.reason) ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-[13px]">{formatDate(action.createdAt)}</td>
                </tr>
              ))}
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
```

- [ ] **Step 3: Run the focused runtime tests**

Run: `npm test -- src/pages/workspace-pages.workflow-runtime-detail.test.tsx`

Expected: PASS.

- [ ] **Step 4: Commit runtime detail replacement**

```bash
git add src/pages/workspace-pages.tsx
git commit -m "feat: replace runtime detail raw rendering"
```

## Task 6: Replace Expense Detail Rendering

**Files:**
- Modify: `src/pages/workspace-pages.tsx`

- [ ] **Step 1: Replace `ExpenseDetailPage`**

```tsx
export function ExpenseDetailPage() {
  const { expenseId } = useParams({ strict: false }) as { expenseId: string }
  const query = useExpensesControllerFindOne({ id: expenseId })
  const expense = unwrapData(query.data) as ExpenseResponseDto | undefined
  const workflowId = expense ? workflowIdFromExpense(expense) : undefined
  const workflowQuery = useWorkflowRuntimeControllerFindOne({ id: workflowId ?? '' })
  const workflow = workflowId
    ? (unwrapData(workflowQuery.data) as WorkflowInstanceResponseDto | undefined)
    : undefined

  return (
    <>
      <PageHeader
        title={expense?.title ?? `Expense ${expenseId}`}
        kicker="Expense detail"
        action={
          workflowId ? (
            <Button type="button" variant="secondary">
              <Link
                to="/workflow-instances/$instanceId"
                params={{ instanceId: workflowId }}
              >
                Full workflow detail
              </Link>
            </Button>
          ) : null
        }
      />
      <ErrorNotice error={query.error ?? workflowQuery.error} />
      {expense ? (
        <div className="space-y-5">
          <ExpenseSummary expense={expense} />
          <ExpenseCustomFields value={expense.customFieldsJson} />
          {workflowId ? (
            workflow ? (
              <WorkflowProgressSection instance={workflow} showActions />
            ) : (
              <EmptyState message="Workflow detail is not available yet." />
            )
          ) : (
            <EmptyState message="No workflow has been started for this expense." />
          )}
          <ExpenseTechnicalReference expense={expense} />
        </div>
      ) : null}
    </>
  )
}
```

- [ ] **Step 2: Add expense summary and custom field components before `LeaveDetailPage`**

```tsx
function ExpenseSummary({ expense }: { expense: ExpenseResponseDto }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{expense.status}</Badge>
        <Badge className="bg-[var(--surface-2)] text-[var(--ink-3)]">
          {expense.category}
        </Badge>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Amount" value={`${expense.amount} ${expense.currency}`} />
        <SummaryValue label="Vendor" value={formatValue(readableValue(expense.vendor))} />
        <SummaryValue label="Quantity" value={formatValue(readableValue(expense.quantity))} />
        <SummaryValue label="Item value" value={formatValue(readableValue(expense.itemValue))} />
        <SummaryValue label="Price" value={formatValue(readableValue(expense.price))} />
        <SummaryValue label="Submitted" value={formatOptionalDate(expense.submittedAt)} />
        <SummaryValue label="Approved" value={formatOptionalDate(expense.approvedAt)} />
        <SummaryValue label="Rejected" value={formatOptionalDate(expense.rejectedAt)} />
        <SummaryValue label="Paid" value={formatOptionalDate(expense.paidAt)} />
        <SummaryValue label="Created" value={formatDate(expense.createdAt)} />
        <SummaryValue label="Updated" value={formatDate(expense.updatedAt)} />
      </div>
      {readableValue(expense.description) ? (
        <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm leading-6 text-[var(--ink-2)]">
          {readableValue(expense.description)}
        </div>
      ) : null}
      {readableValue(expense.rejectionReason) ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
          Rejection reason: {readableValue(expense.rejectionReason)}
        </div>
      ) : null}
    </section>
  )
}

function ExpenseCustomFields({ value }: { value: unknown }) {
  const rows = readableRowsFromRecord(value)
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <SectionHeading label="Expense fields" title="Custom fields" />
      <ReadableRowsSection
        title="Custom fields"
        emptyMessage="No custom fields recorded."
        rows={rows}
      />
    </section>
  )
}

function ExpenseTechnicalReference({
  expense,
}: {
  expense: ExpenseResponseDto
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <SectionHeading label="Technical metadata" title="Reference" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Expense ID" value={expense.id} />
        <SummaryValue label="Requester" value={expense.requesterId} />
        <SummaryValue label="Department" value={formatValue(readableValue(expense.departmentId))} />
        <SummaryValue label="Workflow ID" value={formatValue(workflowIdFromExpense(expense))} />
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Add `ReadableRowsSection` near `SummaryValue`**

```tsx
function ReadableRowsSection({
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
        <div key={`${title}-${row.label}`} className="flex items-start justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
          <span className="text-[var(--muted-foreground)]">{row.label}</span>
          <span className="text-right font-medium text-[var(--foreground)]">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run the focused expense tests**

Run: `npm test -- src/pages/workspace-pages.expense-detail.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit expense detail replacement**

```bash
git add src/pages/workspace-pages.tsx
git commit -m "feat: replace expense detail raw rendering"
```

## Task 7: Run Focused and Full Verification

**Files:**
- Verify only.

- [ ] **Step 1: Run focused detail tests**

Run: `npm test -- src/pages/workspace-pages.workflow-runtime-detail.test.tsx src/pages/workspace-pages.expense-detail.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run related existing detail tests**

Run: `npm test -- src/pages/workspace-pages.workflow-template-detail.test.tsx src/pages/workspace-pages.permissions.test.tsx src/pages/workspace-pages.expense-create.test.tsx`

Expected: PASS. This confirms the existing workflow-template detail style, auth store use, expense create page, and unchanged list permissions still work.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS. There must be no `any`, `@ts-ignore`, `@ts-expect-error`, or non-null assertion workaround.

- [ ] **Step 4: Run lint**

Run: `npm run lint`

Expected: PASS. Fix every ESLint issue in code; do not add inline disables or ESLint config changes.

- [ ] **Step 5: Run full test suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 6: Commit final verification fixes if any were required**

```bash
git add src/pages/workspace-pages.tsx src/pages/workspace-pages.workflow-runtime-detail.test.tsx src/pages/workspace-pages.expense-detail.test.tsx
git commit -m "test: verify workflow detail pages"
```

## Self-Review

- Spec coverage: The plan covers expense summary, custom fields, embedded workflow progress, runtime summary, ordered step timeline, current/next responsibility, approval/rejection panel permission rules, action history, audit table, technical references, generated DTO usage, readable `object` field handling, and the requested focused tests.
- Placeholder scan: The tasks avoid forbidden placeholder wording. Each code-changing step includes concrete code or exact replacement content.
- Type consistency: The plan uses generated DTO names already exported by `src/lib/api/gen/index.ts`, existing helper names from `workspace-pages.tsx`, and `WorkflowStepResponseDto` field names from the generated runtime type.
