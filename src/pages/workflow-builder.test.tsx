import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useWorkflowBuilderStore } from '@/features/workflows/workflow-builder-store'

import { WorkflowBuilderPage } from './index'

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
  useUsersControllerGetUsers: () => ({
    data: { data: [] },
    isLoading: false,
  }),
  useWorkflowTemplateControllerCreateWizard: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
}))

describe('WorkflowBuilderPage trigger setup', () => {
  beforeEach(() => {
    useWorkflowBuilderStore.getState().reset()
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
})
