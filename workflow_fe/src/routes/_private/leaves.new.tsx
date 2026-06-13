import { createFileRoute } from '@tanstack/react-router'

import { LeaveCreatePage } from '@/pages'

export const Route = createFileRoute('/_private/leaves/new')({
  component: LeaveCreatePage,
})
