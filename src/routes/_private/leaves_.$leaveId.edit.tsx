import { createFileRoute } from '@tanstack/react-router'

import { LeaveEditPage } from '@/pages'

export const Route = createFileRoute('/_private/leaves_/$leaveId/edit')({
  component: LeaveEditPage,
})
