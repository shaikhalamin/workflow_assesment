import { describe, expect, it } from 'vitest'

import { getDefaultPrivatePath, isAdminLike } from './auth-routing'

describe('auth routing helpers', () => {
  it('routes admins to workflow templates by default', () => {
    expect(getDefaultPrivatePath(['admin'])).toBe('/workflow-templates')
    expect(isAdminLike(['finance-admin'])).toBe(true)
  })

  it('routes regular employees to the dashboard by default', () => {
    expect(getDefaultPrivatePath(['employee'])).toBe('/')
    expect(isAdminLike(['employee'])).toBe(false)
  })
})
