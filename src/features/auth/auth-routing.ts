const adminRoles = new Set(['admin'])
const workflowBuilderRoles = new Set(['admin', 'workflow-admin'])

export type PermissionSlug =
  | 'auth.profile.read'
  | 'users.read'
  | 'workflow.builder.manage'
  | 'workflow.runtime.act'
  | 'expenses.read'
  | 'expenses.write'
  | 'leaves.read'
  | 'leaves.write'
  | 'payments.read'
  | 'payments.write'
  | 'dashboard.read'
  | 'audit.read'

const privatePathPermissions: Array<{
  path: string
  permission: PermissionSlug
}> = [
  { path: '/workflow-templates', permission: 'workflow.builder.manage' },
  { path: '/event-schemas', permission: 'workflow.builder.manage' },
  { path: '/workflow-instances', permission: 'workflow.runtime.act' },
  { path: '/tasks', permission: 'workflow.runtime.act' },
  { path: '/expenses/new', permission: 'expenses.write' },
  { path: '/expenses', permission: 'expenses.read' },
  { path: '/leaves/new', permission: 'leaves.write' },
  { path: '/leaves', permission: 'leaves.read' },
  { path: '/payments', permission: 'payments.read' },
  { path: '/audit-logs', permission: 'audit.read' },
  { path: '/', permission: 'dashboard.read' },
]

function hasAdminRole(roles: readonly string[] = []) {
  return roles.some((role) => adminRoles.has(role.toLowerCase()))
}

export function hasPermission(
  roles: readonly string[] = [],
  permissions: readonly string[] = [],
  permission: PermissionSlug,
) {
  return hasAdminRole(roles) || permissions.includes(permission)
}

export function canOpenWorkflowBuilder(
  roles: readonly string[] = [],
  permissions: readonly string[] = [],
) {
  return (
    hasPermission(roles, permissions, 'workflow.builder.manage') ||
    roles.some((role) => workflowBuilderRoles.has(role.toLowerCase()))
  )
}

export function canAccessPrivatePath(
  pathname: string,
  roles: readonly string[] = [],
  permissions: readonly string[] = [],
) {
  if (hasAdminRole(roles)) return true

  const required = privatePathPermissions.find(({ path }) => {
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(`${path}/`)
  })

  return required ? permissions.includes(required.permission) : true
}

export function getDefaultPrivatePath(
  roles: readonly string[] = [],
  permissions: readonly string[] = [],
) {
  return canOpenWorkflowBuilder(roles, permissions) ? '/workflow-templates' : '/'
}
