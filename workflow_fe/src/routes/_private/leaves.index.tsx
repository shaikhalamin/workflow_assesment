import { createFileRoute } from '@tanstack/react-router'

import { LeavesPage } from '@/pages/leaves/list/page'

export const Route = createFileRoute('/_private/leaves/')({
  component: LeavesPage,
})
