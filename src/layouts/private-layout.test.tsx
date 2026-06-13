import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  AuthControllerMeQueryResponse,
  AuthUserDto,
  NotificationResponseDto,
} from '@/lib/api/gen'
import { useAuthStore } from '@/stores/auth-store'

import { PrivateLayout } from './private-layout'

const navigateMock = vi.hoisted(() => vi.fn())
const clearQueryClientMock = vi.hoisted(() => vi.fn())
const logoutMutateMock = vi.hoisted(() => vi.fn())
const socketOnMock = vi.hoisted(() => vi.fn())
const socketEmitMock = vi.hoisted(() => vi.fn())
const socketDisconnectMock = vi.hoisted(() => vi.fn())
const socketIoMock = vi.hoisted(() => vi.fn())
const notificationsListMock = vi.hoisted(() => vi.fn())
const markReadMutateMock = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
  Outlet: () => <div />,
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => navigateMock,
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    clear: clearQueryClientMock,
  }),
}))

vi.mock('socket.io-client', () => ({
  io: socketIoMock,
}))

const user: AuthUserDto = {
  id: 'user-1',
  name: 'Dana Operator',
  email: 'dana@example.test',
  roles: ['employee'],
  permissions: [
    'auth.profile.read',
    'expenses.read',
    'expenses.write',
    'leaves.read',
    'leaves.write',
    'billing.read',
    'billing.write',
    'invoices.read',
    'payments.read',
    'dashboard.read',
    'workflow.runtime.read',
    'workflow.runtime.act',
  ],
}

const adminUser: AuthUserDto = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@example.test',
  roles: ['admin'],
  permissions: [],
}

const workflowBuilderUser: AuthUserDto = {
  ...user,
  permissions: [...user.permissions, 'workflow.builder.manage'],
}

let currentUser = user
let unreadNotifications: NotificationResponseDto[] = []

vi.mock('@/lib/api/gen', () => ({
  useAuthControllerLogout: () => ({
    mutate: logoutMutateMock,
  }),
  useAuthControllerMe: () => {
    const meResponse: AuthControllerMeQueryResponse = {
      data: { user: currentUser },
      error: null,
    }

    return {
      data: meResponse,
      error: null,
      isError: false,
    }
  },
  useNotificationsControllerList: notificationsListMock,
  useNotificationsControllerMarkRead: () => ({
    mutate: markReadMutateMock,
  }),
}))

describe('PrivateLayout', () => {
  beforeEach(() => {
    localStorage.clear()
    navigateMock.mockClear()
    clearQueryClientMock.mockClear()
    logoutMutateMock.mockClear()
    socketOnMock.mockClear()
    socketEmitMock.mockClear()
    socketDisconnectMock.mockClear()
    socketIoMock.mockReset()
    socketIoMock.mockReturnValue({
      on: socketOnMock,
      emit: socketEmitMock,
      disconnect: socketDisconnectMock,
    })
    notificationsListMock.mockImplementation(() => ({
      data: {
        data: unreadNotifications,
        meta: {
          page: 1,
          limit: 25,
          total: unreadNotifications.length,
          totalPages: 1,
        },
        error: null,
      },
      error: null,
      isError: false,
    }))
    markReadMutateMock.mockClear()
    unreadNotifications = []
    currentUser = user
    useAuthStore.setState({ isAuthenticated: true, user })
  })

  it('does not render the theme topbar button', () => {
    render(<PrivateLayout />)

    expect(
      screen.queryByRole('button', { name: /toggle theme/i }),
    ).not.toBeInTheDocument()
  })

  it('subscribes to workflow notifications and opens the request detail when clicked', async () => {
    const pointer = userEvent.setup()
    currentUser = {
      ...user,
      roles: ['employee', 'department-reviewer'],
    }
    unreadNotifications = [
      {
        id: 'notification-db-1',
        title: 'Workflow task assigned',
        message: 'Billing needs review',
        type: 'WORKFLOW_TASK_ASSIGNED',
        entityType: 'BillingRequest',
        entityId: 'billing-1',
        workflowInstanceId: 'workflow-1',
        isRead: false,
        readAt: null,
        createdAt: '2026-06-13T09:00:00.000Z',
      },
    ]
    useAuthStore.setState({ isAuthenticated: true, user: currentUser })

    render(<PrivateLayout />)

    expect(notificationsListMock).toHaveBeenCalledWith(
      {
        params: { unreadOnly: true },
      },
      {
        query: { enabled: true, retry: false },
      },
    )
    expect(socketIoMock).toHaveBeenCalledWith('/notifications', {
      withCredentials: true,
    })
    expect(socketEmitMock).not.toHaveBeenCalled()

    const notificationHandler = socketOnMock.mock.calls.find(
      (call: unknown[]) => call[0] === 'notification',
    )?.[1]
    expect(notificationHandler).toEqual(expect.any(Function))

    const handleNotification = notificationHandler as (
      payload: NotificationResponseDto,
    ) => void
    act(() => {
      handleNotification({
        id: 'notification-1',
        title: 'Workflow task assigned',
        message: 'Expense needs approval',
        type: 'WORKFLOW_TASK_ASSIGNED',
        entityType: 'Expense',
        entityId: 'expense-1',
        workflowInstanceId: 'workflow-expense-1',
        isRead: false,
        readAt: null,
        createdAt: '2026-06-13T10:00:00.000Z',
      })
    })

    await pointer.click(
      screen.getByRole('button', { name: /notifications 2/i }),
    )
    expect(screen.getByText('Billing needs review')).toBeInTheDocument()
    await pointer.click(screen.getByRole('button', { name: /expense needs approval/i }))

    expect(markReadMutateMock).toHaveBeenCalledWith({ id: 'notification-1' })
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/expenses/$expenseId',
      params: { expenseId: 'expense-1' },
    })
    expect(screen.queryByText('Expense needs approval')).not.toBeInTheDocument()
  })

  it('logs out locally and redirects when the logout menu item is clicked', async () => {
    const pointer = userEvent.setup()

    render(<PrivateLayout />)

    await pointer.click(screen.getByRole('button', { name: /dana operator/i }))
    await pointer.click(screen.getByRole('button', { name: /log out/i }))

    expect(logoutMutateMock).toHaveBeenCalledTimes(1)
    expect(clearQueryClientMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/sign-in' })
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('only renders navigation links the user can access', () => {
    render(<PrivateLayout />)

    expect(screen.getByRole('link', { name: /^dashboard$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^runtime$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^approvals$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^expenses$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^leaves$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^billing$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^invoices$/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /workflow builder/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^payments$/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /event schemas/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /audit logs/i }),
    ).not.toBeInTheDocument()
  })

  it('does not render event schemas navigation even for workflow builders', () => {
    currentUser = workflowBuilderUser
    useAuthStore.setState({ isAuthenticated: true, user: workflowBuilderUser })

    render(<PrivateLayout />)

    expect(
      screen.getByRole('link', { name: /workflow builder/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /event schemas/i }),
    ).not.toBeInTheDocument()
  })

  it('shows permissions navigation to admins', () => {
    currentUser = adminUser
    useAuthStore.setState({ isAuthenticated: true, user: adminUser })

    render(<PrivateLayout />)

    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^permissions$/i })).toBeInTheDocument()
  })

  it('hides permissions navigation from non-admin users', () => {
    render(<PrivateLayout />)

    expect(
      screen.queryByRole('link', { name: /^permissions$/i }),
    ).not.toBeInTheDocument()
  })
})
