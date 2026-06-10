import { createFileRoute } from '@tanstack/react-router'

import { LeaveCreatePage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/leaves/new')({
  component: LeaveCreatePage,
})
