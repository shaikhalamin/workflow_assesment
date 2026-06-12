import { createFileRoute } from '@tanstack/react-router'

import { BillingRequestsPage } from '@/pages'

export const Route = createFileRoute('/_private/billing/')({
  component: BillingRequestsPage,
})
