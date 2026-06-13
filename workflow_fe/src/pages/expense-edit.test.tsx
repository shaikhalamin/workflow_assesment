import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExpenseEditPage } from './index'

const navigate = vi.hoisted(() => vi.fn())
const resubmitExpense = vi.hoisted(() => vi.fn())
const expenseState = vi.hoisted((): {
  expense: unknown | undefined
  error: unknown
} => ({
  expense: undefined,
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
  useNavigate: () => navigate,
  useParams: () => ({ expenseId: 'expense-1' }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}))

vi.mock('@/lib/api/gen', () => ({
  useAuditLogsControllerList: () => ({ data: { data: [] }, error: null }),
  useAuditLogsControllerListForWorkflow: () => ({ data: { data: [] }, error: null }),
  useDashboardControllerAccounts: () => ({ data: undefined }),
  useDashboardControllerAdmin: () => ({ data: undefined }),
  useDashboardControllerApprover: () => ({ data: undefined }),
  useDashboardControllerEmployee: () => ({ data: undefined }),
  useDashboardControllerHr: () => ({ data: undefined }),
  useExpensesControllerCreate: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useExpensesControllerDelete: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useExpensesControllerFindOne: () => ({
    data: expenseState.expense ? { data: expenseState.expense } : undefined,
    error: expenseState.error,
  }),
  useExpensesControllerList: () => ({ data: { data: [] }, error: null, refetch: vi.fn() }),
  useExpensesControllerResubmit: () => ({
    error: null,
    isPending: false,
    mutate: resubmitExpense,
  }),
  useExpensesControllerSubmit: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useLeavesControllerCreate: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useLeavesControllerDelete: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useLeavesControllerFindOne: () => ({ data: undefined, error: null }),
  useLeavesControllerList: () => ({ data: { data: [] }, error: null, refetch: vi.fn() }),
  useLeavesControllerResubmit: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useLeavesControllerSubmit: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  usePaymentsControllerList: () => ({ data: { data: [] }, error: null }),
  usePaymentsControllerMarkPaid: () => ({ mutate: vi.fn() }),
  useUsersControllerGetUsers: () => ({ data: { data: [] }, isLoading: false }),
  useWorkflowEventSchemaControllerCreate: () => ({ error: null, mutate: vi.fn() }),
  useWorkflowEventSchemaControllerList: () => ({ data: { data: [] }, error: null, refetch: vi.fn() }),
  useWorkflowRuntimeControllerApprove: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useWorkflowRuntimeControllerFindOne: () => ({ data: undefined, error: null }),
  useWorkflowRuntimeControllerList: () => ({ data: { data: [] }, error: null }),
  useWorkflowRuntimeControllerMyPending: () => ({ data: { data: [] }, error: null }),
  useWorkflowRuntimeControllerReject: () => ({ error: null, isPending: false, mutate: vi.fn() }),
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

const rejectedExpense = {
  id: 'expense-1',
  title: 'Original laptop claim',
  description: 'Original receipt note',
  amount: '4500',
  currency: 'BDT',
  category: 'Software',
  vendor: 'Star Tech',
  status: 'REJECTED',
  canResubmit: true,
  rejectionReason: 'Receipt missing',
}

describe('ExpenseEditPage', () => {
  beforeEach(() => {
    expenseState.expense = rejectedExpense
    expenseState.error = null
    navigate.mockClear()
    resubmitExpense.mockClear()
  })

  it('prefills rejected expense fields and resubmits edited data', () => {
    render(<ExpenseEditPage />)

    expect(screen.getByRole('textbox', { name: /title/i })).toHaveDisplayValue(
      'Original laptop claim',
    )
    expect(screen.getByRole('spinbutton', { name: /amount/i })).toHaveValue(4500)
    expect(screen.getByRole('textbox', { name: /currency/i })).toHaveDisplayValue('BDT')
    expect(screen.getByRole('combobox', { name: /category/i })).toHaveDisplayValue('Software')
    expect(screen.getByRole('combobox', { name: /vendor/i })).toHaveDisplayValue('Star Tech')
    expect(screen.getByRole('textbox', { name: /description/i })).toHaveDisplayValue(
      'Original receipt note',
    )

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'Corrected laptop claim' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: /amount/i }), {
      target: { value: '4700' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: /vendor/i }), {
      target: { value: 'Ryans Computers' },
    })
    fireEvent.click(screen.getByRole('button', { name: /resubmit expense/i }))

    expect(resubmitExpense).toHaveBeenCalledWith({
      id: 'expense-1',
      data: expect.objectContaining({
        title: 'Corrected laptop claim',
        amount: 4700,
        currency: 'BDT',
        category: 'Software',
        vendor: 'Ryans Computers',
        description: 'Original receipt note',
      }),
    })
  })

  it('blocks editing when the expense is not resubmittable', () => {
    expenseState.expense = {
      ...rejectedExpense,
      canResubmit: false,
    }

    render(<ExpenseEditPage />)

    expect(
      screen.getByText('This expense cannot be edited and resubmitted.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resubmit expense/i })).not.toBeInTheDocument()
  })
})
