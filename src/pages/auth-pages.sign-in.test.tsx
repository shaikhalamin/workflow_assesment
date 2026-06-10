import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/stores/auth-store'

import { SignInPage } from './auth-pages'

const loginMutateMock = vi.hoisted(() => vi.fn())
const logoutMutateAsyncMock = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}))

vi.mock('@/lib/api/gen', async () => ({
  ...(await vi.importActual<typeof import('@/lib/api/gen')>('@/lib/api/gen')),
  useAuthControllerLogin: () => ({
    error: null,
    isPending: false,
    mutate: loginMutateMock,
  }),
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
})
