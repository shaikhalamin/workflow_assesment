import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthUserDto } from '@/lib/api/gen'
import { useAuthStore } from '@/stores/auth-store'

import { LeaveEditPage } from './index'

const navigate = vi.hoisted(() => vi.fn())
const resubmitLeave = vi.hoisted(() => vi.fn())
const updateLeave = vi.hoisted(() => vi.fn())
const leaveState = vi.hoisted((): {
  leave: unknown | undefined
  error: unknown
  resubmitError: unknown
  updateError: unknown
} => ({
  leave: undefined,
  error: null,
  resubmitError: null,
  updateError: null,
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
    error: leaveState.resubmitError,
    isPending: false,
    mutate: resubmitLeave,
  }),
  useLeavesControllerSubmit: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useLeavesControllerUpdate: () => ({
    error: leaveState.updateError,
    isPending: false,
    mutate: updateLeave,
  }),
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
  requesterId: 'requester-1',
  leaveType: 'ANNUAL',
  leaveDays: 2,
  startDate: '2026-06-10',
  endDate: '2026-06-11',
  reason: 'Family event',
  status: 'REJECTED',
  canResubmit: true,
  rejectionReason: 'Insufficient balance',
}

const requesterUser: AuthUserDto = {
  id: 'requester-1',
  name: 'Leave Requester',
  email: 'requester@example.com',
  roles: ['employee'],
  permissions: ['leaves.read', 'leaves.write'],
}

const otherWriterUser: AuthUserDto = {
  id: 'other-user',
  name: 'Other Writer',
  email: 'other@example.com',
  roles: ['admin'],
  permissions: ['leaves.read', 'leaves.write'],
}

describe('LeaveEditPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ isAuthenticated: true, user: requesterUser })
    leaveState.leave = rejectedLeave
    leaveState.error = null
    leaveState.resubmitError = null
    leaveState.updateError = null
    navigate.mockClear()
    resubmitLeave.mockClear()
    updateLeave.mockClear()
  })

  it('prefills draft leave fields and saves edited data', async () => {
    leaveState.leave = {
      ...rejectedLeave,
      status: 'DRAFT',
      canResubmit: false,
      rejectionReason: null,
    }

    render(<LeaveEditPage />)

    expect(screen.getByRole('combobox', { name: /type/i })).toHaveValue('ANNUAL')

    fireEvent.change(screen.getByRole('combobox', { name: /type/i }), {
      target: { value: 'SICK' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: /leave days/i }), {
      target: { value: '3' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save leave/i }))

    await waitFor(() => {
      expect(updateLeave).toHaveBeenCalledWith({
        id: 'leave-1',
        data: expect.objectContaining({
          leaveType: 'SICK',
          leaveDays: 3,
          startDate: '2026-06-10',
          endDate: '2026-06-11',
          reason: 'Family event',
        }),
      })
    })
    expect(resubmitLeave).not.toHaveBeenCalled()
  })

  it('links back to the leaves list', () => {
    render(<LeaveEditPage />)

    expect(screen.getByRole('link', { name: /back to leaves/i })).toHaveAttribute(
      'href',
      '/leaves',
    )
  })

  it('prefills rejected leave fields and resubmits edited data', async () => {
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

    await waitFor(() => {
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
  })

  it('blocks invalid edited leave days before resubmitting', () => {
    render(<LeaveEditPage />)

    fireEvent.change(screen.getByRole('spinbutton', { name: /leave days/i }), {
      target: { value: '0' },
    })
    fireEvent.click(screen.getByRole('button', { name: /resubmit leave/i }))

    expect(resubmitLeave).not.toHaveBeenCalled()
  })

  it('blocks editing when the leave request is not resubmittable', () => {
    leaveState.leave = {
      ...rejectedLeave,
      status: 'UNDER_REVIEW',
    }

    render(<LeaveEditPage />)

    expect(
      screen.getByText('This leave request cannot be edited.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resubmit leave/i })).not.toBeInTheDocument()
  })

  it('blocks editing when the current user is not the leave requester', () => {
    useAuthStore.setState({ isAuthenticated: true, user: otherWriterUser })

    render(<LeaveEditPage />)

    expect(
      screen.getByText('This leave request cannot be edited.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resubmit leave/i })).not.toBeInTheDocument()
  })

  it('shows a leave update error only once', () => {
    leaveState.updateError = new Error('Only requester can update leave')
    leaveState.leave = {
      ...rejectedLeave,
      status: 'DRAFT',
      canResubmit: false,
      rejectionReason: null,
    }

    render(<LeaveEditPage />)

    expect(screen.getAllByText('Only requester can update leave')).toHaveLength(1)
  })
})
