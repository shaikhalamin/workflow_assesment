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

    expect(
      screen.getByText('Runs when all trigger conditions match:'),
    ).toBeInTheDocument()
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

    expect(
      screen.getByText('Runs for every expense.submitted event.'),
    ).toBeInTheDocument()
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
    expect(screen.getAllByText('Required').length).toBeGreaterThan(0)
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
