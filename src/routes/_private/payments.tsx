import { createFileRoute } from '@tanstack/react-router'

import { PaymentsPage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/payments')({
  component: PaymentsPage,
})
