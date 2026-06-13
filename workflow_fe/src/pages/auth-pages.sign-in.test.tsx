import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthUserDto } from '@/lib/api/gen'
import { useAuthStore } from '@/stores/auth-store'

import { SignInPage } from './auth-pages'

type LoginResponse = { data: { user: AuthUserDto } }
type LoginOnSuccess = (response: LoginResponse) => Promise<void> | void
type LoginOptions = {
  mutation?: {
    onSuccess?: LoginOnSuccess
  }
}

const loginMutateMock = vi.hoisted(() => vi.fn())
const logoutMutateAsyncMock = vi.hoisted(() => vi.fn())
const navigateMock = vi.hoisted(() => vi.fn())
const searchMock = vi.hoisted(() => ({ redirect: undefined as string | undefined }))
const loginOnSuccessRef = vi.hoisted(() => ({
  current: undefined as LoginOnSuccess | undefined,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
  useNavigate: () => navigateMock,
  useSearch: () => searchMock,
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}))

vi.mock('@/lib/api/gen', async () => ({
  ...(await vi.importActual<typeof import('@/lib/api/gen')>('@/lib/api/gen')),
  useAuthControllerLogin: (options: LoginOptions = {}) => {
    loginOnSuccessRef.current = options.mutation?.onSuccess

    return {
      error: null,
      isPending: false,
      mutate: loginMutateMock,
    }
  },
  useAuthControllerLogout: () => ({
    error: null,
    isPending: false,
    mutateAsync: logoutMutateAsyncMock,
  }),
  useAuthControllerSignup: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
}))

describe('SignInPage', () => {
  beforeEach(() => {
    loginMutateMock.mockClear()
    logoutMutateAsyncMock.mockReset()
    navigateMock.mockClear()
    searchMock.redirect = undefined
    loginOnSuccessRef.current = undefined
    useAuthStore.getState().logout()
  })

  it('submits email and password to the login mutation', async () => {
    const pointer = userEvent.setup()

    render(<SignInPage />)

    await pointer.type(screen.getByLabelText(/work email/i), 'employee@example.com')
    await pointer.type(screen.getByLabelText(/password/i), 'Password123!')
    await pointer.click(screen.getByRole('button', { name: /sign in/i }))

    expect(loginMutateMock).toHaveBeenCalledWith({
      data: {
        email: 'employee@example.com',
        password: 'Password123!',
      },
    })
  })

  it('continues preset login when active session logout returns unauthorized', async () => {
    const pointer = userEvent.setup()
    const logoutError = Object.assign(new Error('Unauthorized'), {
      response: { status: 401 },
    })
    logoutMutateAsyncMock.mockRejectedValueOnce(logoutError)
    useAuthStore.getState().login({
      id: 'current-user',
      name: 'Current User',
      email: 'current@example.com',
      roles: [],
      permissions: [],
    })

    render(<SignInPage />)

    await pointer.click(screen.getByRole('button', { name: /login as admin/i }))

    await waitFor(() => {
      expect(logoutMutateAsyncMock).toHaveBeenCalledOnce()
      expect(loginMutateMock).toHaveBeenCalledWith({
        data: {
          email: 'admin@example.com',
          password: 'Password123!',
        },
      })
    })
  })

  it('redirects successful logins to the dashboard', async () => {
    searchMock.redirect = '/workflow-templates'

    render(<SignInPage />)

    await act(async () => {
      await loginOnSuccessRef.current?.({
        data: {
          user: {
            id: 'admin-user',
            name: 'Admin User',
            email: 'admin@example.com',
            roles: ['admin'],
            permissions: ['workflow.builder.manage'],
          },
        },
      })
    })

    expect(navigateMock).toHaveBeenCalledWith({ to: '/', replace: true })
  })
})
