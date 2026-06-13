import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DashboardPage } from './index'

const adminHook = vi.hoisted(() =>
  vi.fn(() => ({
    data: {
      data: {
        workflows: { active: 4, approved: 12, rejected: 2, failed: 1 },
        billing: {
          draft: 3,
          submitted: 5,
          underReview: 7,
          approved: 8,
          rejected: 1,
          invoiced: 6,
          cancelled: 2,
        },
        invoices: { issued: 9, paid: 11, cancelled: 1 },
        payments: { pending: 10, paid: 13, cancelled: 1 },
        recentWorkflowChanges: [
          {
            id: 'workflow-1',
            type: 'BillingRequest',
            title: 'billing.submit',
            createdAt: '2026-06-12T10:00:00.000Z',
          },
        ],
        failedTriggers: 1,
      },
    },
    error: null,
    isLoading: false,
  })),
)

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Page: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Text: ({ children }: { children?: ReactNode }) => <>{children}</>,
  View: ({ children }: { children?: ReactNode }) => <>{children}</>,
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T) => styles,
  },
  PDFDownloadLink: ({ children }: { children?: ReactNode }) => <>{children}</>,
}))

vi.mock('@/lib/api/gen', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/gen')>()
  return {
    ...actual,
    useDashboardControllerAdmin: adminHook,
  }
})

describe('DashboardPage', () => {
  it('renders executive operations summary sections', () => {
    render(<DashboardPage />)

    expect(
      screen.getByRole('heading', { name: /executive operations summary/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Active workflows')).toBeInTheDocument()
    expect(screen.getByText('Billing requests')).toBeInTheDocument()
    expect(screen.getByText('Recent workflow activity')).toBeInTheDocument()
  })

  it('places date filters before the workflow metric area', () => {
    render(<DashboardPage />)

    const activeWorkflowMetric = screen.getByText('Active workflows')
    const fromFilter = screen.getByLabelText(/from/i)

    expect(
      fromFilter.compareDocumentPosition(activeWorkflowMetric) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('passes createdAt date filters to the admin dashboard query', () => {
    render(<DashboardPage />)

    fireEvent.change(screen.getByLabelText(/from/i), {
      target: { value: '2026-06-01' },
    })

    expect(adminHook).toHaveBeenLastCalledWith({
      params: { from: '2026-06-01' },
    })
  })
})
