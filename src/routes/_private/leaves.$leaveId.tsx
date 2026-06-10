import { createFileRoute } from '@tanstack/react-router'

import { LeaveDetailPage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/leaves/$leaveId')({
  component: LeaveDetailPage,
})
