import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PublicLayout } from './public-layout'

let pathname = '/sign-in'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/sign-in">{children}</a>,
  Outlet: () => <div />,
  useLocation: () => ({ pathname }),
}))

describe('PublicLayout', () => {
  beforeEach(() => {
    pathname = '/sign-in'
  })

  it('shows ERP workflow operation copy on the sign in sidebar', () => {
    render(<PublicLayout />)

    expect(screen.getByText('Workflow operations')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Review approvals with the full audit trail in view.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Sign in to act on runtime tasks, track expense, leave, and payment workflows, and keep role-based approvals moving across teams.',
      ),
    ).toBeInTheDocument()
  })

  it('shows configurable approval copy on the sign up sidebar', () => {
    pathname = '/sign-up'

    render(<PublicLayout />)

    expect(screen.getByText('Configurable approvals')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Create an account for ERP workflow execution.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Join the workflow workspace to submit business requests, participate in approval paths, and keep audit-ready activity tied to the right roles.',
      ),
    ).toBeInTheDocument()
  })
})
