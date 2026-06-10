import { createFileRoute } from '@tanstack/react-router'

import { DashboardPage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/')({
  component: DashboardPage,
})
