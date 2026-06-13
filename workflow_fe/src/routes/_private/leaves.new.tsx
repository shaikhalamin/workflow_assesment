import { createFileRoute } from '@tanstack/react-router'

import { LeaveCreatePage } from '@/pages/leaves/create/page'

export const Route = createFileRoute('/_private/leaves/new')({
  component: LeaveCreatePage,
})
