import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthUserDto } from '@/lib/api/gen'
import { useAuthStore } from '@/stores/auth-store'

import { ExpenseDetailPage } from './index'

let expenseResponse: unknown | undefined
let workflowResponse: unknown | undefined
let usersResponse: unknown[] = []

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
  useExpensesControllerResubmit: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
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
  useUsersControllerGetUsers: () => ({
    data: { data: usersResponse },
    isLoading: false,
  }),
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
  requester: {
    id: 'requester-1',
    name: 'Expense Requester',
    email: 'requester@example.com',
  },
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
      assignedUser: {
        id: 'manager-1',
        name: 'Line Manager',
        email: 'manager@example.com',
        designation: 'Manager',
      },
      assignedRoleSlug: null,
      assigneeType: 'USER',
      status: 'APPROVED',
      activatedAt: '2026-06-11T08:00:00.000Z',
      actedAt: '2026-06-11T08:20:00.000Z',
      actionByUserId: 'manager-1',
      actionByUser: {
        id: 'manager-1',
        name: 'Line Manager',
        email: 'manager@example.com',
      },
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
      assignedUser: null,
      assignedRoleSlug: null,
      assigneeType: 'REQUESTER_MANAGER',
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

const requesterUser: AuthUserDto = {
  id: 'requester-1',
  name: 'Expense Requester',
  email: 'requester@example.com',
  roles: ['employee'],
  permissions: ['expenses.read', 'expenses.write'],
}

const otherWriterUser: AuthUserDto = {
  id: 'other-user',
  name: 'Other Writer',
  email: 'other@example.com',
  roles: ['admin'],
  permissions: ['expenses.read', 'expenses.write'],
}

describe('ExpenseDetailPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ isAuthenticated: true, user: requesterUser })
    expenseResponse = baseExpense
    workflowResponse = baseWorkflow
    usersResponse = [
      {
        id: 'requester-1',
        name: 'Expense Requester',
        email: 'requester@example.com',
        employeeCode: null,
        employeeGrade: null,
        designation: 'Engineer',
        departmentId: 'finance',
        managerId: 'manager-1',
        isActive: true,
        lastLoginAt: null,
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-01T08:00:00.000Z',
      },
      {
        id: 'manager-1',
        name: 'Line Manager',
        email: 'manager@example.com',
        employeeCode: null,
        employeeGrade: null,
        designation: 'Manager',
        departmentId: 'finance',
        managerId: null,
        isActive: true,
        lastLoginAt: null,
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-01T08:00:00.000Z',
      },
    ]
  })

  it('links back to the expenses list', () => {
    render(<ExpenseDetailPage />)

    expect(screen.getByRole('link', { name: /back to expenses/i })).toHaveAttribute(
      'href',
      '/expenses',
    )
  })

  it('renders only the requested business expense fields with a labeled note', () => {
    const { container } = render(<ExpenseDetailPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Laptop reimbursement' })).toBeInTheDocument()
    expect(screen.getByText('4500 BDT')).toBeInTheDocument()
    expect(screen.getByText('Software')).toBeInTheDocument()
    expect(screen.getByText('Star Tech')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Replacement laptop for field work')).toBeInTheDocument()
    expect(screen.queryByText('Quantity')).not.toBeInTheDocument()
    expect(screen.queryByText('Item value')).not.toBeInTheDocument()
    expect(screen.queryByText('Price')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Custom fields' })).not.toBeInTheDocument()
    expect(screen.queryByText('Budget owner')).not.toBeInTheDocument()
    expect(screen.queryByText('Project code')).not.toBeInTheDocument()
    expect(container.textContent).not.toContain('customFieldsJson')
    expect(container.textContent).not.toContain('{"budgetOwner"')
    expect(container.textContent).not.toContain('"nested"')

    const summary = screen.getByText('Replacement laptop for field work').closest('section')
    if (!summary) {
      throw new Error('Expected expense summary section to contain the description')
    }
    const summaryContent = summary.textContent ?? ''
    expect(within(summary).getByText('Expense Requester (requester@example.com)')).toBeInTheDocument()
    expect(within(summary).getByText('Category')).toBeInTheDocument()
    expect(summaryContent.indexOf('Requester')).toBeLessThan(summaryContent.indexOf('Category'))
    expect(summaryContent.indexOf('Category')).toBeLessThan(summaryContent.indexOf('Amount'))
    expect(within(summary).getByText('Category')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('Description')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('Replacement laptop for field work')).toHaveClass('text-black')
  })

  it('embeds workflow progress and links to the full runtime detail', () => {
    render(<ExpenseDetailPage />)

    const workflow = screen.getByRole('region', { name: /workflow progress/i })
    expect(within(workflow).getByRole('heading', { level: 3, name: 'Line Manager' })).toBeInTheDocument()
    expect(within(workflow).getByText('Manager')).toHaveClass('font-semibold')
    expect(within(workflow).getByText('Action Type: Approval')).toBeInTheDocument()
    expect(within(workflow).getByRole('heading', { level: 3, name: 'Requester manager' })).toBeInTheDocument()
    expect(within(workflow).getByText('Action Type: Finance Check')).toBeInTheDocument()
    expect(within(workflow).getByText('Current responsibility')).toBeInTheDocument()
    expect(within(workflow).getAllByText(/Line Manager/).length).toBeGreaterThan(0)
    expect(within(workflow).getAllByText(/manager@example.com/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /full workflow detail/i })).toHaveClass(
      'bg-sky-600',
      'text-white',
    )
    expect(screen.getByRole('link', { name: /full workflow detail/i })).toHaveAttribute(
      'href',
      '/workflow-instances/$instanceId',
    )
  })

  it('shows resolved role assignee name and email in embedded workflow progress', () => {
    workflowResponse = {
      ...baseWorkflow,
      steps: baseWorkflow.steps.map((step) =>
        step.id === 'step-2'
          ? {
              ...step,
              assignedUserId: 'finance-1',
              assignedUser: {
                id: 'finance-1',
                name: 'Finance Approver',
                email: 'finance@example.com',
                designation: 'Finance Specialist',
              },
              assignedRoleSlug: 'finance-admin',
              assigneeType: 'ROLE',
            }
          : step,
      ),
    }

    render(<ExpenseDetailPage />)

    const workflow = screen.getByRole('region', { name: /workflow progress/i })
    expect(
      within(workflow).getByRole('heading', {
        level: 3,
        name: 'Finance Approver',
      }),
    ).toBeInTheDocument()
    expect(
      within(workflow).getAllByText(
        /Role: Finance Admin, Finance Approver \(finance@example.com\)/,
      ).length,
    ).toBeGreaterThan(0)
  })

  it('shows requester before category and request creator after the description with names and emails', () => {
    expenseResponse = {
      ...baseExpense,
      requester: {
        id: 'requester-1',
        name: 'Expense Requester',
        email: 'requester@example.com',
      },
      createdById: 'creator-1',
      createdBy: {
        id: 'creator-1',
        name: 'Expense Creator',
        email: 'creator@example.com',
      },
    }

    render(<ExpenseDetailPage />)

    const description = screen.getByText('Replacement laptop for field work')
    const summary = description.closest('section')
    if (!summary) {
      throw new Error('Expected expense summary section to contain the description')
    }

    const summaryContent = summary.textContent ?? ''
    expect(within(summary).getByText('Expense Creator (creator@example.com)')).toBeInTheDocument()
    expect(within(summary).getByText('Expense Requester (requester@example.com)')).toBeInTheDocument()
    expect(summaryContent.indexOf('Requester')).toBeLessThan(summaryContent.indexOf('Category'))
    expect(summaryContent.indexOf('Description')).toBeLessThan(summaryContent.indexOf('Request created by'))
    expect(summaryContent).not.toContain('requester-1')
    expect(summaryContent).not.toContain('creator-1')
  })

  it('shows an empty state when no workflow was started', () => {
    expenseResponse = {
      ...baseExpense,
      workflowInstanceId: null,
      customFieldsJson: null,
    }
    workflowResponse = undefined

    render(<ExpenseDetailPage />)

    expect(screen.queryByText('No custom fields recorded.')).not.toBeInTheDocument()
    expect(screen.getByText('No workflow has been started for this expense.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /full workflow detail/i })).not.toBeInTheDocument()
  })

  it('shows edit and resubmit for rejected resubmittable expenses', () => {
    expenseResponse = {
      ...baseExpense,
      status: 'REJECTED',
      canResubmit: true,
      rejectionReason: 'Receipt missing',
      rejectedAt: '2026-06-12T08:00:00.000Z',
    }
    workflowResponse = undefined

    render(<ExpenseDetailPage />)

    expect(
      screen.getByRole('link', { name: /edit and resubmit/i }),
    ).toHaveAttribute('href', '/expenses/$expenseId/edit')
    expect(screen.getByText(/rejection reason: receipt missing/i)).toBeInTheDocument()
  })

  it('hides edit and resubmit for rejected expenses when the current user is not the requester', () => {
    expenseResponse = {
      ...baseExpense,
      status: 'REJECTED',
      canResubmit: true,
      rejectionReason: 'Receipt missing',
      rejectedAt: '2026-06-12T08:00:00.000Z',
    }
    workflowResponse = undefined
    useAuthStore.setState({ isAuthenticated: true, user: otherWriterUser })

    render(<ExpenseDetailPage />)

    expect(
      screen.queryByRole('link', { name: /edit and resubmit/i }),
    ).not.toBeInTheDocument()
  })

  it('does not show edit and resubmit for rejected non-resubmittable expenses', () => {
    expenseResponse = {
      ...baseExpense,
      status: 'REJECTED',
      canResubmit: false,
      rejectionReason: 'Receipt missing',
      rejectedAt: '2026-06-12T08:00:00.000Z',
    }
    workflowResponse = undefined

    render(<ExpenseDetailPage />)

    expect(
      screen.queryByRole('link', { name: /edit and resubmit/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/rejection reason: receipt missing/i)).toBeInTheDocument()
  })
})
