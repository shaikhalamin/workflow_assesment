import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LeaveCreatePage, LeavesPage } from './index'

const createLeave = vi.fn()
const leaveRowsState = vi.hoisted((): { rows: unknown[] } => ({
  rows: [],
}))

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
    mutate: vi.fn(),
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
    mutate: createLeave,
  }),
  useLeavesControllerDelete: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
  useLeavesControllerFindOne: () => ({ data: undefined, error: null }),
  useLeavesControllerList: () => ({
    data: { data: leaveRowsState.rows },
    error: null,
    refetch: vi.fn(),
  }),
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

describe('LeaveCreatePage', () => {
  it('saves the reason as a string for backend validation', async () => {
    createLeave.mockClear()

    const { container } = render(<LeaveCreatePage />)

    const dateInputs = [
      ...container.querySelectorAll<HTMLInputElement>('input[type="date"]'),
    ]
    const [startDateInput, endDateInput] = dateInputs

    if (!startDateInput || !endDateInput) {
      throw new Error('Expected start and end date inputs')
    }

    fireEvent.change(startDateInput, {
      target: { value: '2026-06-10' },
    })
    fireEvent.change(endDateInput, {
      target: { value: '2026-06-11' },
    })
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Family event' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save leave/i }))

    await waitFor(() => {
      expect(createLeave).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leaveType: 'ANNUAL',
          leaveDays: 1,
          startDate: '2026-06-10',
          endDate: '2026-06-11',
          reason: 'Family event',
        }),
      })
    })
  })

  it('blocks invalid leave days before calling the API', () => {
    createLeave.mockClear()

    render(<LeaveCreatePage />)

    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '0' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save leave/i }))

    expect(createLeave).not.toHaveBeenCalled()
  })
})

describe('LeavesPage', () => {
  it('shows who created each request with name and email', () => {
    leaveRowsState.rows = [
      {
        id: 'leave-1',
        leaveType: 'ANNUAL',
        leaveDays: 2,
        startDate: '2026-06-10',
        endDate: '2026-06-11',
        status: 'DRAFT',
        canResubmit: false,
        createdById: 'creator-1',
        createdBy: {
          id: 'creator-1',
          name: 'Leave Creator',
          email: 'leave.creator@example.com',
        },
      },
    ]

    render(<LeavesPage />)

    expect(screen.getByText('Request created by')).toBeInTheDocument()
    expect(
      screen.getByText('Leave Creator (leave.creator@example.com)'),
    ).toBeInTheDocument()
  })
})
