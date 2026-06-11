import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LeaveEditPage } from './index'

const navigate = vi.hoisted(() => vi.fn())
const resubmitLeave = vi.hoisted(() => vi.fn())
const leaveState = vi.hoisted((): {
  leave: unknown | undefined
  error: unknown
} => ({
  leave: undefined,
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
  useParams: () => ({ leaveId: 'leave-1' }),
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
  useExpensesControllerFindOne: () => ({ data: undefined, error: null }),
  useExpensesControllerList: () => ({ data: { data: [] }, error: null, refetch: vi.fn() }),
  useExpensesControllerResubmit: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useExpensesControllerSubmit: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useLeavesControllerCreate: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useLeavesControllerDelete: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useLeavesControllerFindOne: () => ({
    data: leaveState.leave ? { data: leaveState.leave } : undefined,
    error: leaveState.error,
  }),
  useLeavesControllerList: () => ({ data: { data: [] }, error: null, refetch: vi.fn() }),
  useLeavesControllerResubmit: () => ({
    error: null,
    isPending: false,
    mutate: resubmitLeave,
  }),
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

const rejectedLeave = {
  id: 'leave-1',
  leaveType: 'ANNUAL',
  leaveDays: 2,
  startDate: '2026-06-10',
  endDate: '2026-06-11',
  reason: 'Family event',
  status: 'REJECTED',
  canResubmit: true,
  rejectionReason: 'Insufficient balance',
}

describe('LeaveEditPage', () => {
  beforeEach(() => {
    leaveState.leave = rejectedLeave
    leaveState.error = null
    navigate.mockClear()
    resubmitLeave.mockClear()
  })

  it('prefills rejected leave fields and resubmits edited data', () => {
    const { container } = render(<LeaveEditPage />)
    const dateInputs = [
      ...container.querySelectorAll<HTMLInputElement>('input[type="date"]'),
    ]
    const [startDateInput, endDateInput] = dateInputs

    if (!startDateInput || !endDateInput) {
      throw new Error('Expected start and end date inputs')
    }

    expect(screen.getByRole('combobox', { name: /type/i })).toHaveValue('ANNUAL')
    expect(startDateInput).toHaveDisplayValue('2026-06-10')
    expect(endDateInput).toHaveDisplayValue('2026-06-11')
    expect(screen.getByRole('spinbutton', { name: /leave days/i })).toHaveValue(2)
    expect(screen.getByRole('textbox', { name: /reason/i })).toHaveDisplayValue('Family event')

    fireEvent.change(screen.getByRole('combobox', { name: /type/i }), {
      target: { value: 'CASUAL' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: /leave days/i }), {
      target: { value: '1' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: /reason/i }), {
      target: { value: 'Updated family event' },
    })
    fireEvent.click(screen.getByRole('button', { name: /resubmit leave/i }))

    expect(resubmitLeave).toHaveBeenCalledWith({
      id: 'leave-1',
      data: expect.objectContaining({
        leaveType: 'CASUAL',
        leaveDays: 1,
        startDate: '2026-06-10',
        endDate: '2026-06-11',
        reason: 'Updated family event',
      }),
    })
  })

  it('blocks editing when the leave request is not resubmittable', () => {
    leaveState.leave = {
      ...rejectedLeave,
      status: 'UNDER_REVIEW',
    }

    render(<LeaveEditPage />)

    expect(
      screen.getByText('This leave request cannot be edited and resubmitted.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resubmit leave/i })).not.toBeInTheDocument()
  })
})
