import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LeaveDetailPage } from './index'

let leaveResponse: unknown | undefined
let workflowResponse: unknown | undefined

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
  useParams: () => ({ leaveId: 'leave-1' }),
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
  useLeavesControllerFindOne: () => ({
    data: leaveResponse ? { data: leaveResponse } : undefined,
    error: null,
  }),
  useLeavesControllerList: () => ({ data: { data: [] }, error: null }),
  useLeavesControllerSubmit: () => ({ mutate: vi.fn() }),
  usePaymentsControllerList: () => ({ data: { data: [] }, error: null }),
  usePaymentsControllerMarkPaid: () => ({ mutate: vi.fn() }),
  useUsersControllerGetUsers: () => ({
    data: { data: [] },
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

const baseLeave = {
  id: 'leave-1',
  requesterId: 'requester-1',
  requester: {
    id: 'requester-1',
    name: 'Leave Requester',
    email: 'requester@example.com',
  },
  createdById: 'creator-1',
  createdBy: {
    id: 'creator-1',
    name: 'Leave Creator',
    email: 'creator@example.com',
  },
  departmentId: 'hr',
  leaveType: 'ANNUAL',
  leaveDays: 2,
  startDate: '2026-06-10',
  endDate: '2026-06-11',
  reason: 'Family event',
  employeeGrade: 'G5',
  status: 'UNDER_REVIEW',
  workflowInstanceId: 'wf-1',
  rejectionReason: null,
  approvedPeriodJson: null,
  customFieldsJson: null,
  submittedAt: '2026-06-11T08:00:00.000Z',
  approvedAt: null,
  rejectedAt: null,
  createdAt: '2026-06-10T08:00:00.000Z',
  updatedAt: '2026-06-11T08:00:00.000Z',
}

const baseWorkflow = {
  id: 'wf-1',
  workflowTemplateId: 'template-1',
  workflowApprovalRuleId: 'rule-1',
  moduleName: 'leaves',
  eventName: 'leave.submitted',
  entityType: 'LeaveRequest',
  entityId: 'leave-1',
  requesterId: 'requester-1',
  departmentId: 'hr',
  status: 'ACTIVE',
  metadataJson: { leaveType: 'ANNUAL' },
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
      status: 'ACTIVE',
      activatedAt: '2026-06-11T08:00:00.000Z',
      actedAt: null,
      actionByUserId: null,
      actionByUser: null,
      comment: null,
      rejectionReason: null,
      actions: [],
      createdAt: '2026-06-11T08:00:00.000Z',
      updatedAt: '2026-06-11T08:00:00.000Z',
    },
  ],
  actions: [],
  createdAt: '2026-06-11T08:00:00.000Z',
  updatedAt: '2026-06-11T08:00:00.000Z',
}

describe('LeaveDetailPage', () => {
  beforeEach(() => {
    leaveResponse = baseLeave
    workflowResponse = baseWorkflow
  })

  it('shows leave requester, creator, and embedded workflow progress', () => {
    render(<LeaveDetailPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Leave ANNUAL' })).toBeInTheDocument()
    expect(screen.getByText('2 days')).toBeInTheDocument()
    expect(screen.getByText('Start date')).toBeInTheDocument()
    expect(screen.getByText('End date')).toBeInTheDocument()
    expect(screen.getByText('Reason')).toBeInTheDocument()
    expect(screen.getByText('Family event')).toBeInTheDocument()

    const reason = screen.getByText('Family event')
    const summary = reason.closest('section')
    if (!summary) {
      throw new Error('Expected leave summary section to contain the reason')
    }

    const summaryContent = summary.textContent ?? ''
    expect(within(summary).getAllByText('ANNUAL').length).toBeGreaterThan(0)
    expect(within(summary).getByText('2026-06-10')).toBeInTheDocument()
    expect(within(summary).getByText('2026-06-11')).toBeInTheDocument()
    expect(within(summary).queryByText('Period')).not.toBeInTheDocument()
    expect(summaryContent.indexOf('Requester')).toBeLessThan(summaryContent.indexOf('Leave type'))
    expect(summaryContent.indexOf('Leave type')).toBeLessThan(summaryContent.indexOf('Duration'))
    expect(summaryContent.indexOf('Duration')).toBeLessThan(summaryContent.indexOf('Start date'))
    expect(summaryContent.indexOf('Start date')).toBeLessThan(summaryContent.indexOf('End date'))
    expect(within(summary).getByText('Duration')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('Duration')).not.toHaveClass('text-black')
    expect(within(summary).getByText('Reason')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('Family event')).toHaveClass('text-black')
    expect(within(summary).getByText('Leave Creator (creator@example.com)')).toBeInTheDocument()
    expect(within(summary).getByText('Leave Requester (requester@example.com)')).toBeInTheDocument()
    expect(summaryContent.indexOf('Reason')).toBeLessThan(summaryContent.indexOf('Request created by'))
    expect(summaryContent).not.toContain('requester-1')
    expect(summaryContent).not.toContain('creator-1')

    const workflow = screen.getByRole('region', { name: /workflow progress/i })
    expect(within(workflow).getByRole('heading', { level: 3, name: 'Line Manager' })).toBeInTheDocument()
    expect(within(workflow).getByText('Manager')).toHaveClass('font-semibold')
    expect(within(workflow).getAllByText(/Line Manager/).length).toBeGreaterThan(0)
    expect(within(workflow).getAllByText(/manager@example.com/).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /full workflow detail/i })).toHaveAttribute(
      'href',
      '/workflow-instances/$instanceId',
    )
  })

  it('shows resolved role assignee name and email in embedded workflow progress', () => {
    workflowResponse = {
      ...baseWorkflow,
      steps: baseWorkflow.steps.map((step) => ({
        ...step,
        assignedUserId: 'hr-manager-1',
        assignedUser: {
          id: 'hr-manager-1',
          name: 'HR Manager',
          email: 'hr.manager@example.com',
          designation: 'HR Manager',
        },
        assignedRoleSlug: 'hr-manager',
        assigneeType: 'ROLE',
      })),
    }

    render(<LeaveDetailPage />)

    const workflow = screen.getByRole('region', { name: /workflow progress/i })
    expect(
      within(workflow).getByRole('heading', {
        level: 3,
        name: 'HR Manager',
      }),
    ).toBeInTheDocument()
    expect(
      within(workflow).getAllByText(
        /Role: Hr Manager, HR Manager \(hr.manager@example.com\)/,
      ).length,
    ).toBeGreaterThan(0)
  })

  it('shows an empty state when no workflow was started', () => {
    leaveResponse = {
      ...baseLeave,
      workflowInstanceId: null,
    }
    workflowResponse = undefined

    render(<LeaveDetailPage />)

    expect(screen.getByText('No workflow has been started for this leave request.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /full workflow detail/i })).not.toBeInTheDocument()
  })
})
