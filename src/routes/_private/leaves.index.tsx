import { createFileRoute } from '@tanstack/react-router'

import { LeavesPage } from '@/pages'

export const Route = createFileRoute('/_private/leaves/')({
  component: LeavesPage,
})
