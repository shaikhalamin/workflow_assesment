import { createFileRoute } from '@tanstack/react-router'

import { AuditLogsPage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/audit-logs')({
  component: AuditLogsPage,
})
