import { createFileRoute } from '@tanstack/react-router'

import { LeaveDetailPage } from '@/pages'

export const Route = createFileRoute('/_private/leaves/$leaveId')({
  component: LeaveDetailPage,
})
