import { createFileRoute } from '@tanstack/react-router'

import { BillingEditPage } from '@/pages'

export const Route = createFileRoute('/_private/billing_/$billingId/edit')({
  component: BillingEditPage,
})
