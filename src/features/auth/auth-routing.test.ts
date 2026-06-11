import { describe, expect, it } from 'vitest'

import {
  canAccessPrivatePath,
  canOpenWorkflowBuilder,
  getDefaultPrivatePath,
} from './auth-routing'

describe('auth routing helpers', () => {
  it('routes workflow builder users to the dashboard by default', () => {
    expect(getDefaultPrivatePath()).toBe('/')
    expect(canOpenWorkflowBuilder(['workflow-admin'])).toBe(true)
  })

  it('routes users without workflow builder access to the dashboard by default', () => {
    expect(getDefaultPrivatePath()).toBe('/')
    expect(canOpenWorkflowBuilder(['finance-admin'])).toBe(false)
  })

  it('uses permissions when a non-admin role can manage workflows', () => {
    expect(getDefaultPrivatePath()).toBe('/')
  })

  it('allows admins to access every private path', () => {
    expect(canAccessPrivatePath('/payments', ['admin'], [])).toBe(true)
    expect(canAccessPrivatePath('/audit-logs', ['admin'], [])).toBe(true)
    expect(canAccessPrivatePath('/workflow-templates/new', ['admin'], [])).toBe(
      true,
    )
  })

  it('matches private paths to their required permissions', () => {
    expect(
      canAccessPrivatePath('/expenses', ['employee'], ['expenses.read']),
    ).toBe(true)
    expect(
      canAccessPrivatePath('/expenses/new', ['employee'], ['expenses.read']),
    ).toBe(false)
    expect(
      canAccessPrivatePath('/expenses/new', ['employee'], ['expenses.write']),
    ).toBe(true)
    expect(
      canAccessPrivatePath('/payments', ['employee'], ['expenses.read']),
    ).toBe(false)
    expect(
      canAccessPrivatePath('/payments', ['accounts-officer'], ['payments.read']),
    ).toBe(true)
    expect(
      canAccessPrivatePath('/workflow-instances/123', ['manager'], [
        'workflow.runtime.act',
      ]),
    ).toBe(true)
    expect(
      canAccessPrivatePath('/audit-logs', ['manager'], ['dashboard.read']),
    ).toBe(false)
  })
})
