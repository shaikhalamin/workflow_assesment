import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthUserDto } from '@/lib/api/gen'
import { useAuthStore } from '@/stores/auth-store'

import { ExpensesPage, PaymentsPage, TasksPage } from './workspace-pages'

const pendingTasksState = vi.hoisted((): { pendingTasks: unknown[] } => ({
  pendingTasks: [],
}))

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
  useParams: () => ({}),
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
  useExpensesControllerList: () => ({
    data: {
      data: [
        {
          id: 'expense-1',
          title: 'Fuel',
          amount: 1200,
          currency: 'BDT',
          category: 'Travel',
          status: 'DRAFT',
        },
      ],
    },
    error: null,
    refetch: vi.fn(),
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
  usePaymentsControllerList: () => ({
    data: {
      data: [
        {
          id: 'payment-1',
          expenseId: 'expense-1',
          amount: 1200,
          currency: 'BDT',
          status: 'PENDING',
        },
      ],
    },
    error: null,
    refetch: vi.fn(),
  }),
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
    data: { data: pendingTasksState.pendingTasks },
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
  useWorkflowTemplateControllerFindOne: () => ({ data: undefined }),
  useWorkflowTemplateControllerList: () => ({ data: { data: [] }, error: null }),
  useWorkflowTemplateControllerPublish: () => ({ mutate: vi.fn() }),
}))

const readOnlyExpenseUser: AuthUserDto = {
  id: 'manager-1',
  name: 'Manager User',
  email: 'manager@example.com',
  roles: ['manager'],
  permissions: ['expenses.read'],
}

const readOnlyPaymentUser: AuthUserDto = {
  id: 'finance-1',
  name: 'Finance Admin',
  email: 'finance@example.com',
  roles: ['finance-admin'],
  permissions: ['payments.read'],
}

describe('workspace page permissions', () => {
  beforeEach(() => {
    localStorage.clear()
    pendingTasksState.pendingTasks = []
  })

  it('hides expense write actions from users with read-only expense access', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: readOnlyExpenseUser,
    })

    render(<ExpensesPage />)

    expect(screen.getByText('Fuel')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /new expense/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument()
  })

  it('hides payment write actions from users with read-only payment access', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: readOnlyPaymentUser,
    })

    render(<PaymentsPage />)

    expect(screen.getByText('payment-1')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /mark paid/i }),
    ).not.toBeInTheDocument()
  })

  it('shows a workflow details link for pending approvals', () => {
    pendingTasksState.pendingTasks = [
      {
        id: 'step-1',
        workflowInstanceId: 'workflow-1',
        stepName: 'Manager approval',
        stepType: 'APPROVAL',
        assignedUserId: 'manager-1',
        assignedRoleSlug: null,
        assigneeType: 'USER',
        status: 'ACTIVE',
        activatedAt: '2026-06-11T08:00:00.000Z',
      },
    ]

    render(<TasksPage />)

    expect(screen.getByText('Manager approval')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /view details/i }),
    ).toBeInTheDocument()
  })
})
