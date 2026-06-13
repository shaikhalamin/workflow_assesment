import { createFileRoute } from '@tanstack/react-router'

import { BillingDetailPage } from '@/pages/billing/detail/page'

export const Route = createFileRoute('/_private/billing/$billingId')({
  component: BillingDetailPage,
})
