import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ExpenseCreatePage } from './index'

const createExpense = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
    mutate: createExpense,
  }),
  useExpensesControllerFindOne: () => ({ data: undefined, error: null }),
  useExpensesControllerList: () => ({
    data: { data: [] },
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
    data: { data: [] },
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
  useWorkflowTemplateControllerFindOne: () => ({ data: undefined }),
  useWorkflowTemplateControllerList: () => ({ data: { data: [] }, error: null }),
  useWorkflowTemplateControllerPublish: () => ({ mutate: vi.fn() }),
}))

describe('ExpenseCreatePage', () => {
  it('starts the amount field empty so typed values do not keep a leading zero', () => {
    render(<ExpenseCreatePage />)

    expect(screen.getByRole('spinbutton', { name: /amount/i })).toHaveDisplayValue(
      '',
    )
  })

  it('lets users select known expense categories and vendors', () => {
    createExpense.mockClear()

    render(<ExpenseCreatePage />)

    expect(screen.getByRole('combobox', { name: /category/i })).toHaveDisplayValue(
      'Travel',
    )
    expect(screen.getByRole('combobox', { name: /vendor/i })).toHaveDisplayValue(
      'Star Tech',
    )

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'Lunch with client' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: /amount/i }), {
      target: { value: '1500' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: /category/i }), {
      target: { value: 'Meal' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: /vendor/i }), {
      target: { value: 'Pathao' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
      target: { value: 'Client lunch approval note' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save expense/i }))

    expect(createExpense).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Lunch with client',
        amount: 1500,
        category: 'Meal',
        description: 'Client lunch approval note',
        vendor: 'Pathao',
      }),
    })
  })
})
