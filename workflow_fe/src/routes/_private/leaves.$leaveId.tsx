import { createFileRoute } from '@tanstack/react-router'

import { LeaveDetailPage } from '@/pages/leaves/detail/page'

export const Route = createFileRoute('/_private/leaves/$leaveId')({
  component: LeaveDetailPage,
})
