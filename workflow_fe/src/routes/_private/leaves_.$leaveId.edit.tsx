import { createFileRoute } from '@tanstack/react-router'

import { LeaveEditPage } from '@/pages/leaves/edit/page'

export const Route = createFileRoute('/_private/leaves_/$leaveId/edit')({
  component: LeaveEditPage,
})
