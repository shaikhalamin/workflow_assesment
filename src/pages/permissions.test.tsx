import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthUserDto } from '@/lib/api/gen'
import { useAuthStore } from '@/stores/auth-store'

import { ExpensesPage, LeavesPage, PaymentsPage, TasksPage } from './index'

const pendingTasksState = vi.hoisted((): { pendingTasks: unknown[] } => ({
  pendingTasks: [],
}))
const expenseListState = vi.hoisted((): { expenses: unknown[] } => ({
  expenses: [
    {
      id: 'expense-1',
      title: 'Fuel',
      amount: 1200,
      currency: 'BDT',
      category: 'Travel',
      status: 'DRAFT',
    },
  ],
}))
const leaveListState = vi.hoisted((): { leaves: unknown[] } => ({
  leaves: [
    {
      id: 'leave-1',
      leaveType: 'ANNUAL',
      leaveDays: 2,
      startDate: '2026-06-10',
      endDate: '2026-06-11',
      status: 'DRAFT',
    },
  ],
}))
const submitLeave = vi.hoisted(() => vi.fn())
const submitExpense = vi.hoisted(() => vi.fn())
const resubmitExpense = vi.hoisted(() => vi.fn())
const resubmitLeave = vi.hoisted(() => vi.fn())
const submitExpenseState = vi.hoisted((): { error: unknown } => ({
  error: null,
}))
const submitLeaveState = vi.hoisted((): { error: unknown } => ({
  error: null,
}))
const deleteExpense = vi.hoisted(() => vi.fn())
const deleteLeave = vi.hoisted(() => vi.fn())

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
      data: expenseListState.expenses,
    },
    error: null,
    refetch: vi.fn(),
  }),
  useExpensesControllerDelete: () => ({
    error: null,
    isPending: false,
    mutate: deleteExpense,
  }),
  useExpensesControllerSubmit: () => ({
    error: submitExpenseState.error,
    isPending: false,
    mutate: submitExpense,
  }),
  useExpensesControllerResubmit: () => ({
    error: null,
    isPending: false,
    mutate: resubmitExpense,
  }),
  useLeavesControllerCreate: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
  useLeavesControllerFindOne: () => ({ data: undefined, error: null }),
  useLeavesControllerList: () => ({
    data: {
      data: leaveListState.leaves,
    },
    error: null,
    refetch: vi.fn(),
  }),
  useLeavesControllerDelete: () => ({
    error: null,
    isPending: false,
    mutate: deleteLeave,
  }),
  useLeavesControllerSubmit: () => ({
    error: submitLeaveState.error,
    isPending: false,
    mutate: submitLeave,
  }),
  useLeavesControllerResubmit: () => ({
    error: null,
    isPending: false,
    mutate: resubmitLeave,
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

const writableExpenseUser: AuthUserDto = {
  id: 'employee-1',
  name: 'Employee User',
  email: 'employee@example.com',
  roles: ['employee'],
  permissions: ['expenses.read', 'expenses.write'],
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
    expenseListState.expenses = [
      {
        id: 'expense-1',
        title: 'Fuel',
        amount: 1200,
        currency: 'BDT',
        category: 'Travel',
        status: 'DRAFT',
      },
    ]
    leaveListState.leaves = [
      {
        id: 'leave-1',
        leaveType: 'ANNUAL',
        leaveDays: 2,
        startDate: '2026-06-10',
        endDate: '2026-06-11',
        status: 'DRAFT',
      },
    ]
    pendingTasksState.pendingTasks = []
    submitExpense.mockClear()
    resubmitExpense.mockClear()
    submitLeave.mockClear()
    resubmitLeave.mockClear()
    deleteExpense.mockClear()
    deleteLeave.mockClear()
    submitExpenseState.error = null
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

  it('shows a new expense request button in the empty expense list', () => {
    expenseListState.expenses = []
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableExpenseUser,
    })

    render(<ExpensesPage />)

    expect(screen.getByRole('link', { name: /new expense request/i })).toHaveAttribute(
      'href',
      '/expenses/new',
    )
  })

  it('deletes a draft expense from the list row', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableExpenseUser,
    })

    render(<ExpensesPage />)

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    expect(deleteExpense).toHaveBeenCalledWith({ id: 'expense-1' })
  })

  it('hides expense delete for submitted rows', () => {
    expenseListState.expenses = [
      {
        id: 'expense-1',
        title: 'Fuel',
        amount: 1200,
        currency: 'BDT',
        category: 'Travel',
        status: 'SUBMITTED',
      },
    ]
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableExpenseUser,
    })

    render(<ExpensesPage />)

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('shows expense submit failures on the list page', () => {
    submitExpenseState.error = new Error('Only requester can submit expense')
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableExpenseUser,
    })

    render(<ExpensesPage />)

    expect(screen.getByText('Only requester can submit expense')).toBeInTheDocument()
  })

  it('disables submitted expense rows with submitted text', () => {
    expenseListState.expenses = [
      {
        id: 'expense-1',
        title: 'Fuel',
        amount: 1200,
        currency: 'BDT',
        category: 'Travel',
        status: 'UNDER_REVIEW',
      },
    ]
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableExpenseUser,
    })

    render(<ExpensesPage />)

    expect(screen.getByRole('button', { name: /submitted/i })).toBeDisabled()
  })

  it('links rejected resubmittable expense rows to edit and resubmit', () => {
    expenseListState.expenses = [
      {
        id: 'expense-1',
        title: 'Fuel',
        amount: 1200,
        currency: 'BDT',
        category: 'Travel',
        status: 'REJECTED',
        canResubmit: true,
      },
    ]
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableExpenseUser,
    })

    render(<ExpensesPage />)

    expect(
      screen.getByRole('link', { name: /edit and resubmit/i }),
    ).toHaveAttribute('href', '/expenses/$expenseId/edit')
    expect(screen.queryByRole('button', { name: /^resubmit$/i })).not.toBeInTheDocument()
    expect(resubmitExpense).not.toHaveBeenCalled()
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

  it('shows a new leave request button in the empty leave list', () => {
    leaveListState.leaves = []
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableLeaveUser,
    })

    render(<LeavesPage />)

    expect(screen.getByRole('link', { name: /new leave request/i })).toHaveAttribute(
      'href',
      '/leaves/new',
    )
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

  it('disables submitted leave rows with submitted text', () => {
    leaveListState.leaves = [
      {
        id: 'leave-1',
        leaveType: 'ANNUAL',
        leaveDays: 2,
        startDate: '2026-06-10',
        endDate: '2026-06-11',
        status: 'UNDER_REVIEW',
      },
    ]
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableLeaveUser,
    })

    render(<LeavesPage />)

    expect(screen.getByRole('button', { name: /submitted/i })).toBeDisabled()
  })

  it('links rejected resubmittable leave rows to edit and resubmit', () => {
    leaveListState.leaves = [
      {
        id: 'leave-1',
        leaveType: 'ANNUAL',
        leaveDays: 2,
        startDate: '2026-06-10',
        endDate: '2026-06-11',
        status: 'REJECTED',
        canResubmit: true,
      },
    ]
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableLeaveUser,
    })

    render(<LeavesPage />)

    expect(
      screen.getByRole('link', { name: /edit and resubmit/i }),
    ).toHaveAttribute('href', '/leaves/$leaveId/edit')
    expect(screen.queryByRole('button', { name: /^resubmit$/i })).not.toBeInTheDocument()
    expect(resubmitLeave).not.toHaveBeenCalled()
  })

  it('deletes a draft leave from the list row', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableLeaveUser,
    })

    render(<LeavesPage />)

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    expect(deleteLeave).toHaveBeenCalledWith({ id: 'leave-1' })
  })

  it('hides leave delete for submitted rows', () => {
    leaveListState.leaves = [
      {
        id: 'leave-1',
        leaveType: 'ANNUAL',
        leaveDays: 2,
        startDate: '2026-06-10',
        endDate: '2026-06-11',
        status: 'SUBMITTED',
      },
    ]
    useAuthStore.setState({
      isAuthenticated: true,
      user: writableLeaveUser,
    })

    render(<LeavesPage />)

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
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
