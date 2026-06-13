import { createFileRoute } from '@tanstack/react-router'

import { PermissionsPage } from '@/pages/permissions/page'

export const Route = createFileRoute('/_private/permissions')({
  component: PermissionsPage,
})
