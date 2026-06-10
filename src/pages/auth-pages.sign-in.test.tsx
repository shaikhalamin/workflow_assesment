import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SignInPage } from './auth-pages'

const loginMutateMock = vi.hoisted(() => vi.fn())

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
  useAuthControllerSignup: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  }),
}))

describe('SignInPage', () => {
  beforeEach(() => {
    loginMutateMock.mockClear()
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
})
