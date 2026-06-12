import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PermissionsPage } from './index'

const rolesRefetch = vi.hoisted(() => vi.fn())
const replacePermissions = vi.hoisted(() => vi.fn())
const invalidateQueries = vi.hoisted(() => vi.fn())
const apiState = vi.hoisted(() => ({
  roles: [
    {
      id: 'admin-id',
      name: 'Admin',
      slug: 'admin',
      description: null,
      isSystem: true,
      isLocked: true,
      permissionSlugs: ['expenses.read', 'expenses.write'],
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
    {
      id: 'employee-id',
      name: 'Employee',
      slug: 'employee',
      description: null,
      isSystem: true,
      isLocked: false,
      permissionSlugs: ['expenses.read'],
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
  ],
  permissions: [
    {
      id: 'expenses-read-id',
      name: 'Read expenses',
      slug: 'expenses.read',
      description: null,
      resource: 'expenses',
      action: 'read',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
    {
      id: 'expenses-write-id',
      name: 'Write expenses',
      slug: 'expenses.write',
      description: null,
      resource: 'expenses',
      action: 'write',
      createdAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    },
  ],
  loading: false,
  error: null as unknown,
}))

vi.mock('@/lib/api/gen', () => ({
  authControllerMeQueryKey: () => [{ url: '/api/auth/me' }],
  useRbacControllerListRoles: () => ({
    data: { data: apiState.roles },
    error: apiState.error,
    isLoading: apiState.loading,
    refetch: rolesRefetch,
  }),
  useRbacControllerListPermissions: () => ({
    data: { data: apiState.permissions },
    error: apiState.error,
    isLoading: apiState.loading,
  }),
  useRbacControllerReplaceRolePermissions: () => ({
    error: null,
    isPending: false,
    mutate: replacePermissions,
  }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries,
  }),
}))

describe('PermissionsPage', () => {
  beforeEach(() => {
    apiState.loading = false
    apiState.error = null
    rolesRefetch.mockClear()
    replacePermissions.mockClear()
    invalidateQueries.mockClear()
  })

  it('renders roles and grouped permissions', () => {
    render(<PermissionsPage />)

    expect(screen.getByRole('heading', { name: /permissions/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /employee/i })).toBeInTheDocument()
    expect(screen.getByText('expenses')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /read expenses/i })).toBeChecked()
  })

  it('shows admin locked and does not edit admin permissions', () => {
    render(<PermissionsPage />)

    const adminButton = screen.getByRole('button', { name: /admin/i })
    expect(within(adminButton).getByText(/locked/i)).toBeInTheDocument()
    fireEvent.click(adminButton)
    expect(screen.getByText(/select an editable role/i)).toBeInTheDocument()
  })

  it('keeps save disabled until permissions change', () => {
    render(<PermissionsPage />)

    const save = screen.getByRole('button', { name: /save/i })
    expect(save).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /write expenses/i }))
    expect(save).toBeEnabled()
  })

  it('saves the complete selected permission slug list', () => {
    render(<PermissionsPage />)

    fireEvent.click(screen.getByRole('checkbox', { name: /write expenses/i }))
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(replacePermissions).toHaveBeenCalledWith(
      {
        roleSlug: 'employee',
        data: { permissionSlugs: ['expenses.read', 'expenses.write'] },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('refetches roles after a successful save', async () => {
    render(<PermissionsPage />)

    fireEvent.click(screen.getByRole('checkbox', { name: /write expenses/i }))
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    const options = replacePermissions.mock.calls[0]?.[1]
    act(() => {
      options.onSuccess({
        data: {
          ...apiState.roles[1],
          permissionSlugs: ['expenses.read', 'expenses.write'],
        },
      })
    })

    await waitFor(() => expect(rolesRefetch).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('invalidates cached queries after a successful save', async () => {
    render(<PermissionsPage />)

    fireEvent.click(screen.getByRole('checkbox', { name: /write expenses/i }))
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    const options = replacePermissions.mock.calls[0]?.[1]
    act(() => {
      options.onSuccess({
        data: {
          ...apiState.roles[1],
          permissionSlugs: ['expenses.read', 'expenses.write'],
        },
      })
    })

    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: [{ url: '/api/auth/me' }],
      }),
    )
  })

  it('shows a confirmation after permissions are saved', async () => {
    render(<PermissionsPage />)

    fireEvent.click(screen.getByRole('checkbox', { name: /write expenses/i }))
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    const options = replacePermissions.mock.calls[0]?.[1]
    act(() => {
      options.onSuccess({
        data: {
          ...apiState.roles[1],
          permissionSlugs: ['expenses.read', 'expenses.write'],
        },
      })
    })

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Permissions saved for Employee.',
      )
    })
  })
})
