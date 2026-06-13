import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthUserDto } from '@/lib/api/gen'
import { useAuthStore } from '@/stores/auth-store'

import {
  BillingCreatePage,
  BillingDetailPage,
  BillingEditPage,
  BillingRequestsPage,
  InvoiceDetailPage,
  InvoicesPage,
} from './index'

const billingRowsState = vi.hoisted((): { rows: unknown[] } => ({
  rows: [
    {
      id: 'billing-1',
      requesterId: 'employee-1',
      title: 'Enterprise installation',
      customerName: 'ACME Bangladesh Ltd.',
      createdById: 'creator-1',
      createdBy: {
        id: 'creator-1',
        name: 'Billing Creator',
        email: 'billing.creator@example.com',
      },
      amount: '125000.00',
      currency: 'BDT',
      billingCategory: 'Installation',
      status: 'DRAFT',
      canResubmit: false,
    },
  ],
}))
const invoiceRowsState = vi.hoisted((): { rows: unknown[] } => ({
  rows: [
    {
      id: 'invoice-1',
      billingRequestId: 'billing-1',
      invoiceNumber: 'INV-20260610-0001',
      title: 'Enterprise installation',
      customerName: 'ACME Bangladesh Ltd.',
      amount: '125000.00',
      currency: 'BDT',
      dueDate: '2026-07-10',
      status: 'ISSUED',
      issuedAt: '2026-06-10T09:30:00.000Z',
      cancelledAt: null,
      paidAt: null,
      createdAt: '2026-06-10T09:30:00.000Z',
      updatedAt: '2026-06-10T09:30:00.000Z',
    },
  ],
}))
const billingDetailState = vi.hoisted((): { value: unknown | undefined } => ({
  value: undefined,
}))
const invoiceDetailState = vi.hoisted((): { value: unknown | undefined } => ({
  value: undefined,
}))
const employeeDashboardState = vi.hoisted((): { value: unknown | undefined } => ({
  value: undefined,
}))
const workflowState = vi.hoisted((): { value: unknown | undefined } => ({
  value: undefined,
}))
const createBilling = vi.hoisted(() => vi.fn())
const submitBilling = vi.hoisted(() => vi.fn())
const cancelBilling = vi.hoisted(() => vi.fn())
const resubmitBilling = vi.hoisted(() => vi.fn())
const markInvoicePaid = vi.hoisted(() => vi.fn())
const cancelInvoice = vi.hoisted(() => vi.fn())

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
  useParams: () => ({ billingId: 'billing-1', invoiceId: 'invoice-1' }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}))

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Page: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Text: ({ children }: { children?: ReactNode }) => <>{children}</>,
  View: ({ children }: { children?: ReactNode }) => <>{children}</>,
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T) => styles,
  },
  PDFDownloadLink: ({
    children,
    className,
    fileName,
  }: {
    children?: ReactNode | ((state: { loading: boolean }) => ReactNode)
    className?: string
    fileName: string
  }) => (
    <a href={`download://${fileName}`} className={className}>
      {typeof children === 'function' ? children({ loading: false }) : children}
    </a>
  ),
}))

vi.mock('@/lib/api/gen', () => ({
  useAuditLogsControllerList: () => ({ data: { data: [] }, error: null }),
  useAuditLogsControllerListForWorkflow: () => ({ data: { data: [] }, error: null }),
  useBillingControllerCancel: () => ({ error: null, isPending: false, mutate: cancelBilling }),
  useBillingControllerCreate: () => ({ error: null, isPending: false, mutate: createBilling }),
  useBillingControllerFindOne: () => ({
    data: billingDetailState.value ? { data: billingDetailState.value } : undefined,
    error: null,
  }),
  useBillingControllerList: () => ({
    data: { data: billingRowsState.rows },
    error: null,
    refetch: vi.fn(),
  }),
  useBillingControllerResubmit: () => ({ error: null, isPending: false, mutate: resubmitBilling }),
  useBillingControllerSubmit: () => ({ error: null, isPending: false, mutate: submitBilling }),
  useDashboardControllerAccounts: () => ({ data: undefined }),
  useDashboardControllerAdmin: () => ({ data: undefined }),
  useDashboardControllerApprover: () => ({ data: undefined }),
  useDashboardControllerEmployee: () => ({
    data: employeeDashboardState.value ? { data: employeeDashboardState.value } : undefined,
  }),
  useDashboardControllerFinance: () => ({ data: undefined }),
  useDashboardControllerHr: () => ({ data: undefined }),
  useExpensesControllerCreate: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useExpensesControllerFindOne: () => ({ data: undefined, error: null }),
  useExpensesControllerList: () => ({ data: { data: [] }, error: null }),
  useExpensesControllerSubmit: () => ({ mutate: vi.fn() }),
  useInvoicesControllerCancel: () => ({ error: null, isPending: false, mutate: cancelInvoice }),
  useInvoicesControllerFindOne: () => ({
    data: invoiceDetailState.value ? { data: invoiceDetailState.value } : undefined,
    error: null,
  }),
  useInvoicesControllerList: () => ({
    data: { data: invoiceRowsState.rows },
    error: null,
    refetch: vi.fn(),
  }),
  useInvoicesControllerMarkPaid: () => ({ error: null, isPending: false, mutate: markInvoicePaid }),
  useLeavesControllerCreate: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useLeavesControllerFindOne: () => ({ data: undefined, error: null }),
  useLeavesControllerList: () => ({ data: { data: [] }, error: null }),
  useLeavesControllerSubmit: () => ({ mutate: vi.fn() }),
  usePaymentsControllerList: () => ({ data: { data: [] }, error: null }),
  usePaymentsControllerMarkPaid: () => ({ mutate: vi.fn() }),
  useUsersControllerGetUsers: () => ({ data: { data: [] }, isLoading: false }),
  useWorkflowEventSchemaControllerCreate: () => ({ error: null, mutate: vi.fn() }),
  useWorkflowEventSchemaControllerList: () => ({ data: { data: [] }, error: null, refetch: vi.fn() }),
  useWorkflowRuntimeControllerApprove: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useWorkflowRuntimeControllerFindOne: () => ({
    data: workflowState.value ? { data: workflowState.value } : undefined,
    error: null,
  }),
  useWorkflowRuntimeControllerList: () => ({ data: { data: [] }, error: null }),
  useWorkflowRuntimeControllerMyPending: () => ({ data: { data: [] }, error: null }),
  useWorkflowRuntimeControllerReject: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useWorkflowTemplateControllerCreateWizard: () => ({ error: null, isPending: false, mutate: vi.fn() }),
  useWorkflowTemplateControllerDeactivate: () => ({ mutate: vi.fn() }),
  useWorkflowTemplateControllerFindOne: () => ({ data: undefined }),
  useWorkflowTemplateControllerList: () => ({ data: { data: [] }, error: null }),
  useWorkflowTemplateControllerPublish: () => ({ mutate: vi.fn() }),
}))

const billingUser: AuthUserDto = {
  id: 'employee-1',
  name: 'Billing User',
  email: 'billing@example.com',
  roles: ['employee'],
  permissions: ['billing.read', 'billing.write', 'invoices.read', 'invoices.write'],
}

const adminBillingUser: AuthUserDto = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@example.com',
  roles: ['admin'],
  permissions: ['billing.read', 'billing.write'],
}

describe('billing and invoice pages', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ isAuthenticated: true, user: billingUser })
    billingRowsState.rows = [
      {
        id: 'billing-1',
        requesterId: 'employee-1',
        title: 'Enterprise installation',
        customerName: 'ACME Bangladesh Ltd.',
        createdById: 'creator-1',
        createdBy: {
          id: 'creator-1',
          name: 'Billing Creator',
          email: 'billing.creator@example.com',
        },
        amount: '125000.00',
        currency: 'BDT',
        billingCategory: 'Installation',
        status: 'DRAFT',
        canResubmit: false,
      },
    ]
    billingDetailState.value = {
      id: 'billing-1',
      requesterId: 'employee-1',
      requester: {
        id: 'employee-1',
        name: 'Billing User',
        email: 'billing@example.com',
      },
      departmentId: 'sales',
      customerName: 'ACME Bangladesh Ltd.',
      customerEmail: 'billing@acme.example',
      customerAddress: 'Gulshan Avenue, Dhaka',
      title: 'Enterprise installation',
      description: 'One-time setup fee',
      amount: '125000.00',
      currency: 'BDT',
      billingCategory: 'Installation',
      status: 'INVOICED',
      workflowInstanceId: 'wf-1',
      invoiceId: 'invoice-1',
      canResubmit: false,
      rejectionReason: null,
      customFieldsJson: null,
      submittedAt: '2026-06-10T09:30:00.000Z',
      approvedAt: '2026-06-10T10:30:00.000Z',
      rejectedAt: null,
      createdAt: '2026-06-10T09:00:00.000Z',
      updatedAt: '2026-06-10T10:30:00.000Z',
    }
    invoiceDetailState.value = invoiceRowsState.rows[0]
    employeeDashboardState.value = {
      expenses: { draft: 0, underReview: 0 },
      leaves: { approved: 0, underReview: 0 },
      billing: { draft: 0, underReview: 0, rejected: 0, invoiced: 1 },
      recentInvoices: invoiceRowsState.rows,
      recentItems: [],
    }
    workflowState.value = {
      id: 'wf-1',
      workflowTemplateId: 'template-1',
      workflowApprovalRuleId: 'rule-1',
      moduleName: 'billing',
      eventName: 'billing.submitted',
      entityType: 'BillingRequest',
      entityId: 'billing-1',
      requesterId: 'employee-1',
      requester: null,
      departmentId: 'sales',
      status: 'APPROVED',
      metadataJson: { title: 'Enterprise installation', amount: 125000, currency: 'BDT' },
      startedAt: '2026-06-10T09:30:00.000Z',
      completedAt: '2026-06-10T10:30:00.000Z',
      rejectedAt: null,
      steps: [],
      actions: [],
      createdAt: '2026-06-10T09:30:00.000Z',
      updatedAt: '2026-06-10T10:30:00.000Z',
    }
    createBilling.mockClear()
    submitBilling.mockClear()
    cancelBilling.mockClear()
    resubmitBilling.mockClear()
    markInvoicePaid.mockClear()
    cancelInvoice.mockClear()
  })

  it('lists billing requests with draft submit and cancel actions', () => {
    render(<BillingRequestsPage />)

    expect(screen.getByText('Enterprise installation')).toBeInTheDocument()
    expect(screen.getByText('ACME Bangladesh Ltd.')).toBeInTheDocument()
    expect(screen.getByText('125000.00 BDT')).toBeInTheDocument()
    expect(screen.getByText('Request created by')).toBeInTheDocument()
    expect(
      screen.getByText('Billing Creator (billing.creator@example.com)'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(submitBilling).toHaveBeenCalledWith({ id: 'billing-1' })
    expect(cancelBilling).toHaveBeenCalledWith({ id: 'billing-1' })
  })

  it('hides draft billing submit and cancel actions from non-requester writers', () => {
    useAuthStore.setState({ isAuthenticated: true, user: adminBillingUser })

    render(<BillingRequestsPage />)

    expect(screen.getByRole('link', { name: /open/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
    expect(submitBilling).not.toHaveBeenCalled()
    expect(cancelBilling).not.toHaveBeenCalled()
  })

  it('hides rejected billing edit and resubmit action from non-requester writers', () => {
    billingRowsState.rows = [
      {
        id: 'billing-1',
        requesterId: 'employee-1',
        title: 'Enterprise installation',
        customerName: 'ACME Bangladesh Ltd.',
        createdById: 'creator-1',
        createdBy: {
          id: 'creator-1',
          name: 'Billing Creator',
          email: 'billing.creator@example.com',
        },
        amount: '125000.00',
        currency: 'BDT',
        billingCategory: 'Installation',
        status: 'REJECTED',
        canResubmit: true,
      },
    ]
    useAuthStore.setState({ isAuthenticated: true, user: adminBillingUser })

    render(<BillingRequestsPage />)

    expect(screen.getByRole('link', { name: /open/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /edit and resubmit/i }),
    ).not.toBeInTheDocument()
  })

  it('creates billing requests with customer and amount details', async () => {
    render(<BillingCreatePage />)

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'Monthly enterprise bill' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: /customer name/i }), {
      target: { value: 'ACME Bangladesh Ltd.' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: /amount/i }), {
      target: { value: '125000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save billing request/i }))

    await waitFor(() => {
      expect(createBilling).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Monthly enterprise bill',
          customerName: 'ACME Bangladesh Ltd.',
          amount: 125000,
          currency: 'BDT',
          billingCategory: 'Installation',
        }),
      })
    })
  })

  it('blocks invalid billing amounts before calling the API', () => {
    render(<BillingCreatePage />)

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'Invalid billing request' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: /customer name/i }), {
      target: { value: 'ACME Bangladesh Ltd.' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: /amount/i }), {
      target: { value: '-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save billing request/i }))

    expect(createBilling).not.toHaveBeenCalled()
  })

  it('blocks invalid edited billing amounts before resubmitting', () => {
    const billingDetail = billingDetailState.value
    if (!billingDetail || typeof billingDetail !== 'object') {
      throw new Error('Expected billing detail fixture')
    }

    billingDetailState.value = {
      ...billingDetail,
      status: 'REJECTED',
      canResubmit: true,
    }

    render(<BillingEditPage />)

    fireEvent.change(screen.getByRole('spinbutton', { name: /amount/i }), {
      target: { value: '-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /resubmit billing/i }))

    expect(resubmitBilling).not.toHaveBeenCalled()
  })

  it('shows billing details with workflow and invoice links', () => {
    render(<BillingDetailPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Enterprise installation' })).toBeInTheDocument()
    expect(screen.getByText('ACME Bangladesh Ltd.')).toBeInTheDocument()
    expect(screen.getByText('billing@acme.example')).toBeInTheDocument()
    expect(screen.getByText('125000.00 BDT')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /full workflow detail/i })).toHaveAttribute(
      'href',
      '/workflow-instances/$instanceId',
    )
    expect(screen.getByRole('link', { name: /open invoice/i })).toHaveAttribute(
      'href',
      '/invoices/$invoiceId',
    )
  })

  it('lists invoices and lets invoice writers mark issued invoices paid or cancelled', () => {
    render(<InvoicesPage />)

    expect(screen.getByText('INV-20260610-0001')).toBeInTheDocument()
    expect(screen.getByText('125000.00 BDT')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /download invoice/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /mark paid/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(markInvoicePaid).toHaveBeenCalledWith({ id: 'invoice-1' })
    expect(cancelInvoice).toHaveBeenCalledWith({ id: 'invoice-1' })
  })

  it('shows invoice details with billing request reference', () => {
    render(<InvoiceDetailPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'INV-20260610-0001' })).toBeInTheDocument()
    expect(screen.getByText('Enterprise installation')).toBeInTheDocument()
    expect(screen.getByText('ACME Bangladesh Ltd.')).toBeInTheDocument()
    expect(screen.getByText('2026-07-10')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /download invoice/i })).toBeInTheDocument()

    const reference = screen.getByText('Billing request ID').closest('section')
    if (!reference) throw new Error('Expected invoice reference section')
    expect(within(reference).getByText('billing-1')).toBeInTheDocument()
  })

})
