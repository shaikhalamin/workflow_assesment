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
  departmentId: 'finance',
  status: 'ACTIVE',
  metadataJson: {
    title: 'Laptop reimbursement',
    amount: 4500,
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

    expect(screen.getByRole('heading', { level: 1, name: 'Workflow wf-1' })).toBeInTheDocument()
    expect(screen.getByText('Current responsibility')).toBeInTheDocument()
    expect(screen.getByText('Finance approval')).toBeInTheDocument()
    expect(screen.getAllByText(/Active Approver/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/active@example.com/).length).toBeGreaterThan(0)
    expect(screen.getByText('Next responsibility')).toBeInTheDocument()
    expect(screen.getByText('Accounts payment check')).toBeInTheDocument()

    const timeline = screen.getByRole('region', { name: /workflow progress/i })
    const stepOne = within(timeline).getByText('Manager review')
    const stepTwo = within(timeline).getByText('Finance approval')
    const stepThree = within(timeline).getByText('Accounts payment check')
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

  it('lets a directly assigned active user approve and reject from the detail page', () => {
    render(<WorkflowInstanceDetailPage />)

    const panel = screen.getByRole('region', { name: /approval decision/i })
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
      name: 'Finance approval',
    })
    const actionBox = within(progress).getByRole('heading', {
      level: 3,
      name: 'Active approval step',
    })
    const nextStep = within(progress).getByRole('heading', {
      level: 3,
      name: 'Accounts payment check',
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
      name: 'Manager review',
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
      name: 'Manager review',
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
      name: 'Manager review',
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
