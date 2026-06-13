import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
RbacRoleResponseDto
} from '@/lib/api/gen'
import { authControllerMeQueryKey,useRbacControllerListPermissions,useRbacControllerListRoles,useRbacControllerReplaceRolePermissions } from '@/lib/api/gen'
import {
rowsFrom,
unwrapData
} from '@/lib/format'
import {
ErrorNotice,
PageHeader
} from '@/pages/utils/page-components'
import {
groupedPermissions,
sameSlugSet
} from '@/pages/utils/page-helpers'

export function PermissionsPage() {
  const rolesQuery = useRbacControllerListRoles()
  const permissionsQuery = useRbacControllerListPermissions()
  const updateRolePermissions = useRbacControllerReplaceRolePermissions()
  const queryClient = useQueryClient()
  const roles = rowsFrom(rolesQuery.data)
  const permissions = rowsFrom(permissionsQuery.data)
  const [selectedRoleSlug, setSelectedRoleSlug] = useState<string | null>(null)
  const [checkedSlugs, setCheckedSlugs] = useState<string[]>([])
  const [savedSlugs, setSavedSlugs] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const editableRoles = roles.filter((role) => !role.isLocked)
  const effectiveSelectedRoleSlug = selectedRoleSlug ?? editableRoles[0]?.slug ?? null
  const selectedRole: RbacRoleResponseDto | null = effectiveSelectedRoleSlug
    ? roles.find(
        (role) => role.slug === effectiveSelectedRoleSlug && !role.isLocked,
      ) ?? null
    : null
  const selectedCheckedSlugs =
    selectedRoleSlug === null ? selectedRole?.permissionSlugs ?? [] : checkedSlugs
  const selectedSavedSlugs =
    selectedRoleSlug === null ? selectedRole?.permissionSlugs ?? [] : savedSlugs

  const isDirty = !sameSlugSet(selectedCheckedSlugs, selectedSavedSlugs)
  const permissionGroups = groupedPermissions(permissions)
  const saveDisabled =
    !selectedRole || updateRolePermissions.isPending || !isDirty

  const togglePermission = (slug: string) => {
    if (!selectedRole) return

    setSuccessMessage(null)
    setCheckedSlugs((current) =>
      (selectedRoleSlug === null ? selectedRole.permissionSlugs : current).includes(slug)
        ? (selectedRoleSlug === null ? selectedRole.permissionSlugs : current).filter(
            (currentSlug) => currentSlug !== slug,
          )
        : [
            ...(selectedRoleSlug === null ? selectedRole.permissionSlugs : current),
            slug,
          ].sort(),
    )
    if (selectedRoleSlug === null) {
      setSelectedRoleSlug(selectedRole.slug)
      setSavedSlugs(selectedRole.permissionSlugs)
    }
  }

  const savePermissions = () => {
    if (!selectedRole) return
    setSuccessMessage(null)
    updateRolePermissions.mutate(
      {
        roleSlug: selectedRole.slug,
        data: { permissionSlugs: selectedCheckedSlugs },
      },
      {
        onSuccess: (response) => {
          const updatedRole = unwrapData(response)
          if (updatedRole) {
            setSelectedRoleSlug(updatedRole.slug)
            setCheckedSlugs(updatedRole.permissionSlugs)
            setSavedSlugs(updatedRole.permissionSlugs)
            setSuccessMessage(`Permissions saved for ${updatedRole.name}.`)
          }
          void rolesQuery.refetch()
          void queryClient.invalidateQueries({ queryKey: authControllerMeQueryKey() })
        },
      },
    )
  }

  if (rolesQuery.isLoading || permissionsQuery.isLoading) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Loading permissions...
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Permissions"
        description="Edit seeded permission assignments for non-admin roles."
      />
      <ErrorNotice
        error={
          rolesQuery.error ??
          permissionsQuery.error ??
          updateRolePermissions.error
        }
      />
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className="rounded-md border border-[var(--border)] bg-white p-3">
          <h2 className="px-1 text-sm font-semibold">Roles</h2>
          <div className="mt-3 space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                  selectedRole?.slug === role.slug
                    ? 'border-[var(--primary)] bg-[var(--brand-soft)]'
                    : 'border-[var(--border)] hover:bg-[var(--surface-2)]'
                }`}
                onClick={() => {
                  if (role.isLocked) {
                    setSelectedRoleSlug(role.slug)
                    setCheckedSlugs([])
                    setSavedSlugs([])
                    setSuccessMessage(null)
                    return
                  }
                  setSelectedRoleSlug(role.slug)
                  setCheckedSlugs(role.permissionSlugs)
                  setSavedSlugs(role.permissionSlugs)
                  setSuccessMessage(null)
                }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium">{role.name}</span>
                  {role.isLocked ? <Badge>LOCKED</Badge> : null}
                </span>
                <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                  {role.slug} - {role.permissionSlugs.length} permissions
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-4">
          {selectedRole ? (
            <>
              {successMessage ? (
                <div
                  role="status"
                  className="mb-4 rounded-md border border-green-200 bg-[var(--success-soft)] px-3 py-2 text-sm font-medium text-[var(--success)]"
                >
                  {successMessage}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{selectedRole.name}</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {selectedRole.slug}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={savePermissions}
                  disabled={saveDisabled}
                >
                  Save
                </Button>
              </div>
              <div className="mt-5 space-y-4">
                {Object.entries(permissionGroups).map(([resource, group]) => (
                  <div
                    key={resource}
                    className="rounded-md border border-[var(--border)] p-3"
                  >
                    <h3 className="text-sm font-semibold">{resource}</h3>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {group.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex gap-2 rounded-md border border-[var(--border)] p-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCheckedSlugs.includes(permission.slug)}
                            onChange={() => togglePermission(permission.slug)}
                          />
                          <span>
                            <span className="block font-medium">
                              {permission.name}
                            </span>
                            <span className="block text-xs text-[var(--muted-foreground)]">
                              {permission.slug}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              Select an editable role to change permissions.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
