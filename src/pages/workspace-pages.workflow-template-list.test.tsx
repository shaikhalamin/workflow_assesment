import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { WorkflowTemplatesPage } from './workspace-pages'

let workflowTemplateRows: Array<Record<string, unknown>> = []

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
  useExpensesControllerDelete: () => ({ mutate: vi.fn() }),
  useExpensesControllerFindOne: () => ({ data: undefined, error: null }),
  useExpensesControllerList: () => ({ data: { data: [] }, error: null }),
  useExpensesControllerSubmit: () => ({ mutate: vi.fn() }),
  useLeavesControllerCreate: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
  useLeavesControllerDelete: () => ({ mutate: vi.fn() }),
  useLeavesControllerFindOne: () => ({ data: undefined, error: null }),
  useLeavesControllerList: () => ({ data: { data: [] }, error: null }),
  useLeavesControllerSubmit: () => ({ mutate: vi.fn() }),
  usePaymentsControllerList: () => ({ data: { data: [] }, error: null }),
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
  useWorkflowTemplateControllerFindOne: () => ({ data: undefined, error: null }),
  useWorkflowTemplateControllerList: () => ({
    data: { data: workflowTemplateRows },
    error: null,
    refetch: vi.fn(),
  }),
  useWorkflowTemplateControllerPublish: () => ({ mutate: vi.fn() }),
}))

describe('WorkflowTemplatesPage actions', () => {
  it('renders list actions with detail label and without duplicate action', () => {
    workflowTemplateRows = [
      {
        id: 'template-1',
        name: 'Expense workflow',
        moduleName: 'expenses',
        eventName: 'expense.submitted',
        status: 'DRAFT',
        priority: 5,
        workflowInstanceCount: 0,
      },
    ]

    render(<WorkflowTemplatesPage />)

    const row = screen.getByRole('row', { name: /expense workflow/i })

    expect(within(row).getByRole('link', { name: /view details/i })).toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: /duplicate/i })).not.toBeInTheDocument()
    expect(within(row).getByRole('button', { name: /publish/i })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: /deactivate/i })).toHaveClass(
      'border-[var(--destructive)]',
    )
  })

  it('hides publish for published workflows and blocks deactivate when instances exist', () => {
    workflowTemplateRows = [
      {
        id: 'template-2',
        name: 'Leave workflow',
        moduleName: 'leaves',
        eventName: 'leave.submitted',
        status: 'PUBLISHED',
        priority: 3,
        workflowInstanceCount: 1,
      },
    ]

    render(<WorkflowTemplatesPage />)

    const row = screen.getByRole('row', { name: /leave workflow/i })

    expect(within(row).queryByRole('button', { name: /publish/i })).not.toBeInTheDocument()
    expect(within(row).getByRole('button', { name: /deactivate/i })).toBeDisabled()
    expect(
      within(row).getByText('Worflow already associated can not deactivate'),
    ).toBeInTheDocument()
  })
})
