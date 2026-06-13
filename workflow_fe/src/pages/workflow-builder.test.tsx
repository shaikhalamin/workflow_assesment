import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useWorkflowBuilderStore } from '@/features/workflows/workflow-builder-store'

import { WorkflowBuilderPage } from './index'

const createWorkflowWizard = vi.hoisted(() => vi.fn())
const updateWorkflowTemplate = vi.hoisted(() => vi.fn())
const deleteWorkflowRule = vi.hoisted(() => vi.fn())
const createWorkflowRule = vi.hoisted(() => vi.fn())
let templateResponse: unknown | undefined

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
  }: {
    children: React.ReactNode
  }) => <>{children}</>,
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}))

vi.mock('@/lib/api/gen', () => ({
  workflowRuleControllerDelete: deleteWorkflowRule,
  workflowTemplateControllerCreateRule: createWorkflowRule,
  workflowTemplateControllerUpdate: updateWorkflowTemplate,
  useUsersControllerGetUsers: () => ({
    data: { data: [] },
    isLoading: false,
  }),
  useWorkflowTemplateControllerCreateWizard: () => ({
    error: null,
    isPending: false,
    mutate: createWorkflowWizard,
  }),
  useWorkflowTemplateControllerFindOne: () => ({
    data: templateResponse ? { data: templateResponse } : undefined,
    error: null,
    isLoading: false,
  }),
}))

describe('WorkflowBuilderPage trigger setup', () => {
  beforeEach(() => {
    templateResponse = undefined
    useWorkflowBuilderStore.getState().reset()
    createWorkflowWizard.mockClear()
    updateWorkflowTemplate.mockReset()
    deleteWorkflowRule.mockReset()
    createWorkflowRule.mockReset()
    updateWorkflowTemplate.mockResolvedValue({ data: { id: 'template-1' } })
    deleteWorkflowRule.mockResolvedValue({ data: { success: true } })
    createWorkflowRule.mockResolvedValue({ data: { id: 'new-rule-1' } })
  })

  it('hides condition fields until trigger mode uses conditions', () => {
    render(<WorkflowBuilderPage />)

    expect(screen.getByDisplayValue('Run Always')).toBeInTheDocument()
    expect(screen.queryByText('Field')).not.toBeInTheDocument()
    expect(screen.queryByText('Operator')).not.toBeInTheDocument()
    expect(screen.queryByText('Value')).not.toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue('Run Always'), {
      target: { value: 'conditions' },
    })

    expect(screen.getByText('Field')).toBeInTheDocument()
    expect(screen.getByText('Operator')).toBeInTheDocument()
    expect(screen.getByText('Value')).toBeInTheDocument()
  })

  it('starts added rules from the default approval chain', () => {
    render(<WorkflowBuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /rules/i }))
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))

    const rules = useWorkflowBuilderStore.getState().draft.rules

    expect(rules[1]?.steps).toEqual(rules[0]?.steps)

    fireEvent.click(screen.getByRole('button', { name: /approval chain/i }))

    expect(screen.getAllByText('Default approval path').length).toBeGreaterThan(0)
    expect(screen.getAllByText('New approval rule').length).toBeGreaterThan(0)
    expect(screen.getByText('Started from the default approval path. Customize if this rule needs different approvers.')).toBeInTheDocument()
  })

  it('groups approval-chain steps under their matching rule', () => {
    render(<WorkflowBuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /rules/i }))
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    fireEvent.click(screen.getByRole('button', { name: /approval chain/i }))

    expect(screen.getByRole('group', { name: /rule 1 default approval path/i })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /rule 2 new approval rule/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /add approval step/i })).toHaveLength(2)
  })

  it('removes an added approval step from a rule', () => {
    render(<WorkflowBuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /approval chain/i }))
    fireEvent.click(screen.getByRole('button', { name: /add approval step/i }))

    expect(useWorkflowBuilderStore.getState().draft.rules[0]?.steps).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: /remove approval step 2/i }))

    expect(useWorkflowBuilderStore.getState().draft.rules[0]?.steps).toHaveLength(1)
  })

  it('limits approval step action and handler options to the supported choices', () => {
    render(<WorkflowBuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /approval chain/i }))

    const actionTypeSelect = screen.getByDisplayValue('Approval')
    const handlerSelect = screen.getByDisplayValue('Requester manager')

    if (
      !(actionTypeSelect instanceof HTMLSelectElement) ||
      !(handlerSelect instanceof HTMLSelectElement)
    ) {
      throw new Error('Approval step select fields were not found')
    }

    expect(Array.from(actionTypeSelect.options).map((option) => option.text)).toEqual([
      'Review',
      'Approval',
    ])
    expect(Array.from(handlerSelect.options).map((option) => option.text)).toEqual([
      'Role queue',
      'Specific user',
      'Requester manager',
    ])
  })

  it('expands live preview approval paths into a visual timeline', () => {
    render(<WorkflowBuilderPage />)

    expect(
      screen.getByRole('button', {
        name: /collapse default approval path approval path preview/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Step 1')).toBeInTheDocument()
    expect(screen.getByText('SLA 24h')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: /collapse default approval path approval path preview/i,
      }),
    )

    expect(screen.queryByText('Step 1')).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: /expand default approval path approval path preview/i,
      }),
    )

    expect(screen.getByText('Step 1')).toBeInTheDocument()
  })

  it('lets approval rules choose a comparison operator', () => {
    render(<WorkflowBuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /rules/i }))

    expect(screen.getByText('Condition Operator')).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue('gte'), {
      target: { value: 'lt' },
    })

    const [rule] = useWorkflowBuilderStore.getState().draft.rules

    expect(rule?.isFallback).toBe(false)
    expect(rule?.conditionJson?.conditions[0]?.operator).toBe('lt')
  })

  it('shows only module-specific outcome options', () => {
    render(<WorkflowBuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /outcomes/i }))

    expect(screen.getByText('Approved status')).toBeInTheDocument()
    expect(screen.getByText('Rejected status')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Create payment request after expense approval'),
    ).toBeInTheDocument()
    expect(
      screen.queryByLabelText('Allow resubmission after rejection'),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /setup/i }))

    const moduleSelect = screen
      .getAllByDisplayValue('Expense')
      .find((element): element is HTMLSelectElement => element instanceof HTMLSelectElement)

    if (!moduleSelect) {
      throw new Error('Module select was not found')
    }

    fireEvent.change(moduleSelect, {
      target: { value: 'leaves' },
    })
    fireEvent.click(screen.getByRole('button', { name: /outcomes/i }))

    expect(screen.getByText('Approved status')).toBeInTheDocument()
    expect(screen.getByText('Rejected status')).toBeInTheDocument()
    expect(
      screen.queryByLabelText('Create payment request after expense approval'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('Allow resubmission after rejection'),
    ).not.toBeInTheDocument()
  })

  it('blocks workflow saves when the template name is blank after trimming', () => {
    render(<WorkflowBuilderPage />)

    const [workflowNameInput] = screen.getAllByRole('textbox')

    if (!workflowNameInput) {
      throw new Error('Workflow name input was not found')
    }

    fireEvent.change(workflowNameInput, {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /05review/i }))
    fireEvent.click(screen.getByRole('button', { name: /save workflow/i }))

    expect(createWorkflowWizard).not.toHaveBeenCalled()
  })

  it('preloads a draft workflow and replaces its rules when saving edits', async () => {
    templateResponse = {
      id: 'template-1',
      name: 'Existing draft workflow',
      description: 'Routes travel expenses',
      moduleName: 'expenses',
      eventName: 'expense.submitted',
      entityType: 'Expense',
      status: 'DRAFT',
      priority: 8,
      effectiveFrom: '2026-06-01T00:00:00.000Z',
      effectiveTo: null,
      allowResubmission: true,
      triggerCondition: {
        conditionJson: {
          mode: 'all',
          conditions: [{ field: 'amount', operator: 'gte', value: 3000 }],
        },
      },
      rules: [
        {
          id: 'rule-1',
          name: 'Travel approval',
          priority: 1,
          conditionJson: {
            mode: 'all',
            conditions: [{ field: 'category', operator: 'eq', value: 'travel' }],
          },
          isFallback: false,
          isActive: true,
          steps: [
            {
              stepOrder: 1,
              stepName: 'Finance review',
              stepType: 'REVIEW',
              assigneeType: 'ROLE',
              assigneeRoleSlug: 'finance-admin',
              assigneeUserId: null,
              assigneeFieldPath: null,
              isRequired: true,
              requiresComment: true,
              canReject: true,
              canReassign: false,
              slaHours: 48,
            },
          ],
        },
      ],
      outcomeConfig: {
        approvedActionsJson: { setStatus: 'APPROVED', notifyRequester: true },
        rejectedActionsJson: { setStatus: 'REJECTED', requireReason: true },
      },
    }

    render(<WorkflowBuilderPage mode="edit" templateId="template-1" />)

    await waitFor(() =>
      expect(screen.getByDisplayValue('Existing draft workflow')).toBeInTheDocument(),
    )
    expect(screen.getByText('Edit workflow template')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Run When Conditions Match')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /05review/i }))
    fireEvent.click(screen.getByRole('button', { name: /save workflow/i }))

    await waitFor(() => expect(updateWorkflowTemplate).toHaveBeenCalled())

    expect(updateWorkflowTemplate).toHaveBeenCalledWith({
      id: 'template-1',
      data: expect.objectContaining({
        name: 'Existing draft workflow',
        triggerConditionJson: {
          mode: 'all',
          conditions: [{ field: 'amount', operator: 'gte', value: 3000 }],
        },
      }),
    })
    expect(deleteWorkflowRule).toHaveBeenCalledWith({ id: 'rule-1' })
    expect(createWorkflowRule).toHaveBeenCalledWith({
      id: 'template-1',
      data: expect.objectContaining({
        name: 'Travel approval',
        steps: [
          expect.objectContaining({
            stepName: 'Finance review',
            assigneeRoleSlug: 'finance-admin',
          }),
        ],
      }),
    })
  })
})
