const adminRoles = new Set([
  'admin',
  'workflow-admin',
  'finance-admin',
  'accounts',
  'accounts-officer',
  'hr',
  'hr-officer',
  'cfo',
  'management',
])

export function isAdminLike(roles: string[] = []) {
  return roles.some((role) => adminRoles.has(role.toLowerCase()))
}

export function getDefaultPrivatePath(roles: string[] = []) {
  return isAdminLike(roles) ? '/workflow-templates' : '/'
}
