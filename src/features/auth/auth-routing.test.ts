import { describe, expect, it } from 'vitest'

import {
  canAccessPrivatePath,
  canOpenWorkflowBuilder,
  getDefaultPrivatePath,
} from './auth-routing'

describe('auth routing helpers', () => {
  it('routes workflow builder users to workflow templates by default', () => {
    expect(
      getDefaultPrivatePath(['admin'], ['workflow.builder.manage']),
    ).toBe('/workflow-templates')
    expect(canOpenWorkflowBuilder(['workflow-admin'])).toBe(true)
  })

  it('routes users without workflow builder access to the dashboard by default', () => {
    expect(getDefaultPrivatePath(['employee'])).toBe('/')
    expect(getDefaultPrivatePath(['accounts-officer'])).toBe('/')
    expect(getDefaultPrivatePath(['finance-admin'])).toBe('/')
    expect(getDefaultPrivatePath(['hr-officer'])).toBe('/')
    expect(getDefaultPrivatePath(['cfo'])).toBe('/')
    expect(canOpenWorkflowBuilder(['finance-admin'])).toBe(false)
  })

  it('uses permissions when a non-admin role can manage workflows', () => {
    expect(
      getDefaultPrivatePath(['management'], ['workflow.builder.manage']),
    ).toBe('/workflow-templates')
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
