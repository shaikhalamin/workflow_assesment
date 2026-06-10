import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useWorkflowBuilderStore } from '@/features/workflows/workflow-builder-store'

import { WorkflowBuilderPage } from './workspace-pages'

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
})
