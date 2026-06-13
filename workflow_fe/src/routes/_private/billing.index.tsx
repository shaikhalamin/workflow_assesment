import { createFileRoute } from '@tanstack/react-router'

import { BillingRequestsPage } from '@/pages/billing/list/page'

export const Route = createFileRoute('/_private/billing/')({
  component: BillingRequestsPage,
})
