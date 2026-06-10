import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  AuthControllerMeQueryResponse,
  AuthUserDto,
} from '@/lib/api/gen'
import { useAuthStore } from '@/stores/auth-store'

import { PrivateLayout } from './private-layout'

const navigateMock = vi.hoisted(() => vi.fn())
const clearQueryClientMock = vi.hoisted(() => vi.fn())
const logoutMutateMock = vi.hoisted(() => vi.fn())

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
    'dashboard.read',
    'workflow.runtime.act',
  ],
}

const meResponse: AuthControllerMeQueryResponse = {
  data: { user },
  error: null,
}

vi.mock('@/lib/api/gen', () => ({
  useAuthControllerLogout: () => ({
    mutate: logoutMutateMock,
  }),
  useAuthControllerMe: () => ({
    data: meResponse,
    error: null,
    isError: false,
  }),
}))

describe('PrivateLayout', () => {
  beforeEach(() => {
    localStorage.clear()
    navigateMock.mockClear()
    clearQueryClientMock.mockClear()
    logoutMutateMock.mockClear()
    useAuthStore.setState({ isAuthenticated: true, user })
  })

  it('does not render theme or notification topbar buttons', () => {
    render(<PrivateLayout />)

    expect(
      screen.queryByRole('button', { name: /toggle theme/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /notifications/i }),
    ).not.toBeInTheDocument()
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
    expect(
      screen.queryByRole('link', { name: /workflow builder/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /payments/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /event schemas/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /audit logs/i }),
    ).not.toBeInTheDocument()
  })
})
