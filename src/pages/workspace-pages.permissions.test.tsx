import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthUserDto } from '@/lib/api/gen'
import { useAuthStore } from '@/stores/auth-store'

import { ExpensesPage, LeavesPage, PaymentsPage, TasksPage } from './workspace-pages'

const pendingTasksState = vi.hoisted((): { pendingTasks: unknown[] } => ({
  pendingTasks: [],
}))
const submitLeave = vi.hoisted(() => vi.fn())
const submitLeaveState = vi.hoisted((): { error: unknown } => ({
  error: null,
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
  useLeavesControllerList: () => ({
    data: {
      data: [
        {
          id: 'leave-1',
          leaveType: 'ANNUAL',
          leaveDays: 2,
          startDate: '2026-06-10',
          endDate: '2026-06-11',
          status: 'DRAFT',
        },
      ],
    },
    error: null,
    refetch: vi.fn(),
  }),
  useLeavesControllerSubmit: () => ({
    error: submitLeaveState.error,
    isPending: false,
    mutate: submitLeave,
  }),
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

const writableLeaveUser: AuthUserDto = {
  id: 'employee-1',
  name: 'Employee User',
  email: 'employee@example.com',
  roles: ['employee'],
  permissions: ['leaves.read', 'leaves.write'],
}

describe('workspace page permissions', () => {
  beforeEach(() => {
    localStorage.clear()
    pendingTasksState.pendingTasks = []
    submitLeave.mockClear()
    submitLeaveState.error = null
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

  it('matches expense list styling for leave open and submit actions', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableLeaveUser,
    })

    render(<LeavesPage />)

    expect(screen.getByText('ANNUAL')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open/i })).toHaveClass(
      'border-sky-200',
      'bg-sky-50',
      'text-sky-700',
    )
    expect(screen.getByRole('button', { name: /submit/i })).toHaveClass(
      'border-emerald-600',
      'bg-emerald-600',
      'text-white',
    )
  })

  it('shows leave submit failures on the list page', () => {
    submitLeaveState.error = new Error('Only requester can submit leave')
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableLeaveUser,
    })

    render(<LeavesPage />)

    expect(screen.getByText('Only requester can submit leave')).toBeInTheDocument()
  })

  it('submits a draft leave from the list row', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableLeaveUser,
    })

    render(<LeavesPage />)

    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    expect(submitLeave).toHaveBeenCalledWith({ id: 'leave-1' })
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
        request: {
          title: 'Laptop charger reimbursement',
          type: 'Expense',
          requesterId: 'employee-1',
          requester: {
            id: 'employee-1',
            name: 'Employee User',
            email: 'employee@example.com',
          },
          amount: 4500,
          currency: 'BDT',
          leaveDays: null,
          createdAt: '2026-06-11T07:30:00.000Z',
        },
      },
    ]

    render(<TasksPage />)

    expect(screen.getByText('Manager approval')).toBeInTheDocument()
    expect(screen.getByText('Laptop charger reimbursement')).toBeInTheDocument()
    expect(screen.getByText('Expense')).toBeInTheDocument()
    expect(screen.getByText(/Employee User/)).toBeInTheDocument()
    expect(screen.getByText('BDT 4,500')).toBeInTheDocument()
    expect(screen.getAllByText(/Jun 11, 2026/).length).toBeGreaterThanOrEqual(2)
    expect(
      screen.getByRole('link', { name: /view details/i }),
    ).toBeInTheDocument()
  })
})
