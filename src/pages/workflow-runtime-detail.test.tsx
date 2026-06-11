import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthUserDto } from '@/lib/api/gen'
import { useAuthStore } from '@/stores/auth-store'

import { WorkflowInstanceDetailPage } from './index'

let approveStep = vi.fn()
let rejectStep = vi.fn()
let invalidateQueries = vi.fn()
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
  useParams: () => ({ instanceId: 'wf-1' }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries,
  }),
}))

vi.mock('@/lib/api/gen', () => ({
  useAuditLogsControllerList: () => ({ data: { data: [] }, error: null }),
  useAuditLogsControllerListForWorkflow: () => ({
    data: {
      data: [
        {
          id: 'audit-1',
          action: 'WORKFLOW_UPDATED',
          entityType: 'WorkflowInstance',
          entityId: 'wf-1',
          oldStatus: 'ACTIVE',
          newStatus: 'APPROVED',
          comment: 'Completed',
          createdAt: '2026-06-11T10:00:00.000Z',
        },
      ],
    },
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
    mutate: approveStep,
  }),
  useWorkflowRuntimeControllerFindOne: () => ({
    data: workflowResponse ? { data: workflowResponse } : undefined,
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
    mutate: rejectStep,
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

const assignedUser: AuthUserDto = {
  id: 'user-active',
  name: 'Active Approver',
  email: 'active@example.com',
  roles: ['employee'],
  permissions: [],
}

const financeUser: AuthUserDto = {
  id: 'finance-1',
  name: 'Finance Approver',
  email: 'finance@example.com',
  roles: ['finance-admin'],
  permissions: [],
}

const unassignedUser: AuthUserDto = {
  id: 'other-user',
  name: 'Other User',
  email: 'other@example.com',
  roles: ['employee'],
  permissions: [],
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
  requester: {
    id: 'requester-1',
    name: 'Expense Requester',
    email: 'requester@example.com',
    designation: 'Analyst',
  },
  departmentId: 'finance',
  status: 'ACTIVE',
  metadataJson: {
    title: 'Laptop reimbursement',
    vendor: 'Star Tech',
    currency: 'BDT',
    amount: 4500,
    category: 'Software',
    nested: { ignored: true },
  },
  startedAt: '2026-06-11T08:00:00.000Z',
  completedAt: null,
  rejectedAt: null,
  steps: [
    {
      id: 'step-3',
      workflowInstanceId: 'wf-1',
      stepOrder: 3,
      stepName: 'Accounts payment check',
      stepType: 'FINAL_VERIFICATION',
      assignedUserId: null,
      assignedRoleSlug: 'accounts-admin',
      assigneeType: 'ROLE',
      status: 'WAITING',
      activatedAt: null,
      actedAt: null,
      actionByUserId: null,
      comment: null,
      rejectionReason: null,
      actions: [],
      createdAt: '2026-06-11T08:00:00.000Z',
      updatedAt: '2026-06-11T08:00:00.000Z',
    },
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
        designation: 'Manager',
      },
      comment: 'Looks correct',
      rejectionReason: null,
      actions: [
        {
          id: 'action-1',
          workflowInstanceId: 'wf-1',
          workflowStepId: 'step-1',
          action: 'APPROVED',
          actorUserId: 'manager-1',
          actorUser: {
            id: 'manager-1',
            name: 'Line Manager',
            email: 'manager@example.com',
            designation: 'Manager',
          },
          comment: 'Looks correct',
          reason: null,
          metadataJson: null,
          createdAt: '2026-06-11T08:20:00.000Z',
        },
      ],
      createdAt: '2026-06-11T08:00:00.000Z',
      updatedAt: '2026-06-11T08:20:00.000Z',
    },
    {
      id: 'step-2',
      workflowInstanceId: 'wf-1',
      stepOrder: 2,
      stepName: 'Finance approval',
      stepType: 'FINANCE_CHECK',
      assignedUserId: 'user-active',
      assignedUser: {
        id: 'user-active',
        name: 'Active Approver',
        email: 'active@example.com',
        designation: 'Finance Specialist',
      },
      assignedRoleSlug: null,
      assigneeType: 'USER',
      status: 'ACTIVE',
      activatedAt: '2026-06-11T08:21:00.000Z',
      actedAt: null,
      actionByUserId: null,
      comment: null,
      rejectionReason: null,
      actions: [
        {
          id: 'action-2',
          workflowInstanceId: 'wf-1',
          workflowStepId: 'step-2',
          action: 'STEP_ACTIVATED',
          actorUserId: null,
          comment: 'Ready for finance',
          reason: null,
          metadataJson: null,
          createdAt: '2026-06-11T08:21:00.000Z',
        },
      ],
      createdAt: '2026-06-11T08:00:00.000Z',
      updatedAt: '2026-06-11T08:21:00.000Z',
    },
  ],
  actions: [
    {
      id: 'action-workflow-1',
      workflowInstanceId: 'wf-1',
      workflowStepId: null,
      action: 'TRIGGERED',
      actorUserId: 'requester-1',
      actorUser: {
        id: 'requester-1',
        name: 'Expense Requester',
        email: 'requester@example.com',
        designation: 'Analyst',
      },
      comment: 'Submitted expense',
      reason: null,
      metadataJson: null,
      createdAt: '2026-06-11T08:00:00.000Z',
    },
  ],
  createdAt: '2026-06-11T08:00:00.000Z',
  updatedAt: '2026-06-11T08:21:00.000Z',
}

describe('WorkflowInstanceDetailPage', () => {
  beforeEach(() => {
    approveStep = vi.fn()
    rejectStep = vi.fn()
    invalidateQueries = vi.fn()
    workflowResponse = baseWorkflow
    usersResponse = [
      {
        id: 'requester-1',
        name: 'Expense Requester',
        email: 'requester@example.com',
        employeeCode: null,
        employeeGrade: null,
        designation: 'Analyst',
        departmentId: 'finance',
        managerId: null,
        isActive: true,
        lastLoginAt: null,
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-01T08:00:00.000Z',
      },
      {
        id: 'user-active',
        name: 'Active Approver',
        email: 'active@example.com',
        employeeCode: null,
        employeeGrade: null,
        designation: 'Finance Specialist',
        departmentId: 'finance',
        managerId: null,
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
    useAuthStore.setState({ isAuthenticated: true, user: assignedUser })
    localStorage.clear()
  })

  it('renders ordered readable workflow progress and responsibility summaries', () => {
    const { container } = render(<WorkflowInstanceDetailPage />)

    expect(screen.getByText('Runtime detail')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Laptop reimbursement' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Workflow wf-1' })).not.toBeInTheDocument()
    const requester = screen.getAllByText('Expense Requester (requester@example.com)')[0]
    if (!requester) throw new Error('Expected workflow requester to be rendered')
    const summary = requester.closest('section')
    if (!summary) throw new Error('Expected workflow summary section')
    const summaryContent = summary.textContent ?? ''
    expect(within(summary).getByText('Title')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('Laptop reimbursement')).toBeInTheDocument()
    expect(within(summary).getByText('Vendor')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('Star Tech')).toBeInTheDocument()
    expect(within(summary).getByText('Currency')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('BDT')).toBeInTheDocument()
    expect(within(summary).getByText('Amount')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('4500')).toBeInTheDocument()
    expect(within(summary).getByText('Category')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('Software')).toBeInTheDocument()
    expect(summaryContent.indexOf('Requester')).toBeLessThan(summaryContent.indexOf('Category'))
    expect(screen.getByText('Current responsibility')).toBeInTheDocument()
    expect(screen.getByText(/Finance approval/)).toBeInTheDocument()
    expect(screen.getAllByText(/Active Approver/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/active@example.com/).length).toBeGreaterThan(0)
    expect(screen.getByText('Next responsibility')).toBeInTheDocument()
    expect(screen.getByText(/Accounts payment check/)).toBeInTheDocument()

    const timeline = screen.getByRole('region', { name: /workflow progress/i })
    const stepOne = within(timeline).getByRole('heading', { level: 3, name: 'Line Manager' })
    const stepTwo = within(timeline).getByRole('heading', { level: 3, name: 'Active Approver' })
    const stepThree = within(timeline).getByRole('heading', { level: 3, name: 'Accounts Admin' })
    expect(stepOne.compareDocumentPosition(stepTwo) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(stepTwo.compareDocumentPosition(stepThree) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(within(timeline).getByText('Completed successfully')).toBeInTheDocument()
    expect(within(timeline).getByText('Currently waiting for action')).toBeInTheDocument()
    expect(within(timeline).getByText('Upcoming step')).toBeInTheDocument()
    expect(within(timeline).getByText('Looks correct')).toBeInTheDocument()
    expect(within(timeline).getByText('Ready for finance')).toBeInTheDocument()
    expect(container.textContent).not.toContain('"steps"')
    expect(container.textContent).not.toContain('metadataJson')
    expect(container.textContent).not.toContain('{"nested"')
  })

  it('shows leave request details in the workflow summary', () => {
    workflowResponse = {
      ...baseWorkflow,
      moduleName: 'leaves',
      eventName: 'leave.submitted',
      entityType: 'LeaveRequest',
      entityId: 'leave-1',
      departmentId: 'hr',
      metadataJson: {
        title: 'Annual leave request',
        leaveType: 'ANNUAL',
        leaveDays: 2,
        startDate: '2026-06-10',
        endDate: '2026-06-11',
        employeeGrade: 'G5',
      },
    }

    render(<WorkflowInstanceDetailPage />)

    const requester = screen.getAllByText('Expense Requester (requester@example.com)')[0]
    if (!requester) throw new Error('Expected workflow requester to be rendered')
    const summary = requester.closest('section')
    if (!summary) throw new Error('Expected workflow summary section')
    const summaryContent = summary.textContent ?? ''

    expect(within(summary).getByText('Leave type')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('ANNUAL')).toBeInTheDocument()
    expect(within(summary).getByText('Duration')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('2 days')).toBeInTheDocument()
    expect(within(summary).getByText('Start date')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('2026-06-10')).toBeInTheDocument()
    expect(within(summary).getByText('End date')).toHaveClass('text-[var(--ink-3)]')
    expect(within(summary).getByText('2026-06-11')).toBeInTheDocument()
    expect(summaryContent.indexOf('Leave type')).toBeLessThan(summaryContent.indexOf('Duration'))
    expect(summaryContent.indexOf('Duration')).toBeLessThan(summaryContent.indexOf('Start date'))
    expect(summaryContent.indexOf('Start date')).toBeLessThan(summaryContent.indexOf('End date'))
  })

  it('shows approval assignee name and designation before the step name in timeline cards', () => {
    render(<WorkflowInstanceDetailPage />)

    const progress = screen.getByRole('region', { name: /workflow progress/i })
    const stepOneLabel = within(progress).getByText('Step 1')
    const stepOne = stepOneLabel.closest('article')
    if (!stepOne) throw new Error('Expected first step article')

    const stepTwoLabel = within(progress).getByText('Step 2')
    const stepTwo = stepTwoLabel.closest('article')
    if (!stepTwo) throw new Error('Expected second step article')
    const stepThreeLabel = within(progress).getByText('Step 3')
    const stepThree = stepThreeLabel.closest('article')
    if (!stepThree) throw new Error('Expected third step article')

    expect(within(stepOne).getByRole('heading', { level: 3, name: 'Line Manager' })).toHaveClass(
      'font-semibold',
    )
    expect(within(stepOne).getByText('Manager')).toHaveClass('font-semibold')
    expect(within(stepOne).getByText('Action Type: Approval')).toBeInTheDocument()
    expect(within(stepOne).queryByRole('heading', { level: 3, name: 'Manager review' })).not.toBeInTheDocument()

    expect(within(stepTwo).getByRole('heading', { level: 3, name: 'Active Approver' })).toHaveClass(
      'font-semibold',
    )
    expect(within(stepTwo).getByText('Finance Specialist')).toHaveClass('font-semibold')
    expect(within(stepTwo).getByText('Action Type: Finance Check')).toBeInTheDocument()
    expect(within(stepTwo).queryByRole('heading', { level: 3, name: 'Finance approval' })).not.toBeInTheDocument()
    expect(stepTwo).toHaveClass('bg-white')
    expect(stepTwo).not.toHaveClass('bg-blue-50')
    expect(stepThree).toHaveClass('bg-white')
    expect(stepThree).not.toHaveClass('bg-[var(--surface-2)]')
  })

  it('lets a directly assigned active user approve and reject from the detail page', () => {
    render(<WorkflowInstanceDetailPage />)

    const panel = screen.getByRole('region', { name: /approval decision/i })
    expect(panel).toHaveClass('bg-white')
    expect(panel).not.toHaveClass('bg-[var(--surface-2)]')
    fireEvent.change(within(panel).getByRole('textbox', { name: /comment or rejection reason/i }), {
      target: { value: 'Approved from detail' },
    })
    fireEvent.click(within(panel).getByRole('button', { name: /approve/i }))
    fireEvent.click(within(panel).getByRole('button', { name: /reject/i }))

    expect(approveStep).toHaveBeenCalledWith({
      id: 'step-2',
      data: { comment: 'Approved from detail' },
    })
    expect(rejectStep).toHaveBeenCalledWith({
      id: 'step-2',
      data: { reason: 'Approved from detail' },
    })
  })

  it('shows the approver action box directly below the active approval step', () => {
    render(<WorkflowInstanceDetailPage />)

    const progress = screen.getByRole('region', { name: /workflow progress/i })
    const activeStep = within(progress).getByRole('heading', {
      level: 3,
      name: 'Active Approver',
    })
    const actionBox = within(progress).getByRole('heading', {
      level: 3,
      name: 'Active approval step',
    })
    const nextStep = within(progress).getByRole('heading', {
      level: 3,
      name: 'Accounts Admin',
    })

    expect(activeStep.compareDocumentPosition(actionBox) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(actionBox.compareDocumentPosition(nextStep) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('shows actor name and email in the approval step summary', () => {
    render(<WorkflowInstanceDetailPage />)

    const progress = screen.getByRole('region', { name: /workflow progress/i })
    const actedStepHeading = within(progress).getByRole('heading', {
      level: 3,
      name: 'Line Manager',
    })
    const actedStep = actedStepHeading.closest('article')
    if (!actedStep) throw new Error('Expected manager review step article')

    const actorLabel = within(actedStep).getByText('Actor')
    const actorField = actorLabel.closest('div')
    if (!actorField) throw new Error('Expected actor summary field')

    expect(actorField).toHaveTextContent('Line Manager (manager@example.com)')
    expect(actorField).not.toHaveTextContent('manager-1')
  })

  it('shows assignee and actor name from workflow user objects', () => {
    usersResponse = []
    workflowResponse = {
      ...baseWorkflow,
      steps: baseWorkflow.steps.map((step) =>
        step.id === 'step-1'
          ? {
              ...step,
              assignedUserId: {
                id: 'manager-1',
                name: 'Line Manager',
                email: 'manager@example.com',
              },
              actionByUserId: {
                id: 'manager-1',
                name: 'Line Manager',
                email: 'manager@example.com',
              },
              actions: step.actions.map((action) => ({
                ...action,
                actorUserId: {
                  id: 'manager-1',
                  name: 'Line Manager',
                  email: 'manager@example.com',
                },
              })),
            }
          : step,
      ),
    }

    render(<WorkflowInstanceDetailPage />)

    const progress = screen.getByRole('region', { name: /workflow progress/i })
    const actedStepHeading = within(progress).getByRole('heading', {
      level: 3,
      name: 'Line Manager',
    })
    const actedStep = actedStepHeading.closest('article')
    if (!actedStep) throw new Error('Expected manager review step article')

    expect(actedStep).toHaveTextContent('Assignee: User: Line Manager (manager@example.com)')
    expect(actedStep).toHaveTextContent('Line Manager (manager@example.com)')
    expect(actedStep).not.toHaveTextContent('manager-1')
  })

  it('shows actor name and email in step and workflow action history', () => {
    render(<WorkflowInstanceDetailPage />)

    const progress = screen.getByRole('region', { name: /workflow progress/i })
    expect(within(progress).getByText(/Actor: Line Manager \(manager@example.com\)/)).toBeInTheDocument()
    const workflowActionRow = screen.getByRole('row', { name: /Submitted expense/ })
    expect(within(workflowActionRow).getByRole('cell', { name: 'Expense Requester (requester@example.com)' })).toBeInTheDocument()
    expect(workflowActionRow).not.toHaveTextContent('requester-1')
  })

  it('shows requester manager resolved assignee from embedded assigned user', () => {
    workflowResponse = {
      ...baseWorkflow,
      steps: baseWorkflow.steps.map((step) =>
        step.id === 'step-1'
          ? {
              ...step,
              assigneeType: 'REQUESTER_MANAGER',
              assignedUserId: 'manager-1',
              assignedUser: {
                id: 'manager-1',
                name: 'Line Manager',
                email: 'manager@example.com',
              },
            }
          : step,
      ),
    }

    render(<WorkflowInstanceDetailPage />)

    const progress = screen.getByRole('region', { name: /workflow progress/i })
    const actedStepHeading = within(progress).getByRole('heading', {
      level: 3,
      name: 'Line Manager',
    })
    const actedStep = actedStepHeading.closest('article')
    if (!actedStep) throw new Error('Expected manager review step article')

    expect(actedStep).toHaveTextContent(
      /Resolved assignee\s*Requester manager: Line Manager \(manager@example.com\)/,
    )
    expect(actedStep).not.toHaveTextContent('User ID: manager-1')
  })

  it('shows role assignee with matching approver name and email', () => {
    workflowResponse = {
      ...baseWorkflow,
      steps: baseWorkflow.steps.map((step) =>
        step.id === 'step-2'
          ? {
              ...step,
              assignedUserId: null,
              assignedUser: null,
              assignedRoleSlug: 'finance-admin',
              assigneeType: 'ROLE',
            }
          : step,
      ),
    }
    useAuthStore.setState({ isAuthenticated: true, user: financeUser })

    render(<WorkflowInstanceDetailPage />)

    expect(screen.getAllByText(/Role: Finance Admin, Finance Approver \(finance@example.com\)/).length).toBeGreaterThan(0)
  })

  it('shows embedded role assignee name and email to non-role viewers', () => {
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
    useAuthStore.setState({ isAuthenticated: true, user: unassignedUser })

    render(<WorkflowInstanceDetailPage />)

    const progress = screen.getByRole('region', { name: /workflow progress/i })
    expect(
      within(progress).getByRole('heading', {
        level: 3,
        name: 'Finance Approver',
      }),
    ).toBeInTheDocument()
    expect(
      within(progress).getAllByText(
        /Role: Finance Admin, Finance Approver \(finance@example.com\)/,
      ).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByRole('region', { name: /approval decision/i })).not.toBeInTheDocument()
  })

  it('lets a matching role approver act on the active step', () => {
    workflowResponse = {
      ...baseWorkflow,
      steps: baseWorkflow.steps.map((step) =>
        step.id === 'step-2'
          ? {
              ...step,
              assignedUserId: null,
              assignedUser: null,
              assignedRoleSlug: 'finance-admin',
              assigneeType: 'ROLE',
            }
          : step,
      ),
    }
    useAuthStore.setState({ isAuthenticated: true, user: financeUser })

    render(<WorkflowInstanceDetailPage />)

    expect(
      screen.getByRole('region', { name: /approval decision/i }),
    ).toBeInTheDocument()
  })

  it('hides approve and reject controls from unassigned users', () => {
    useAuthStore.setState({ isAuthenticated: true, user: unassignedUser })

    render(<WorkflowInstanceDetailPage />)

    expect(screen.getByText('Current responsibility')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /approval decision/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument()
  })
})
