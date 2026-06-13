import { createFileRoute } from '@tanstack/react-router'

import { BillingCreatePage } from '@/pages/billing/create/page'

export const Route = createFileRoute('/_private/billing/new')({
  component: BillingCreatePage,
})
