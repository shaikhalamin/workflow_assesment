import { createFileRoute } from '@tanstack/react-router'

import { AuditLogsPage } from '@/pages/audit-logs/page'

export const Route = createFileRoute('/_private/audit-logs')({
  component: AuditLogsPage,
})
