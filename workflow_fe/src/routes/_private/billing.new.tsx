import { createFileRoute } from '@tanstack/react-router'

import { BillingCreatePage } from '@/pages'

export const Route = createFileRoute('/_private/billing/new')({
  component: BillingCreatePage,
})
