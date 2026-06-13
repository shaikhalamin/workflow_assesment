import { createFileRoute } from '@tanstack/react-router'

import { InvoicesPage } from '@/pages'

export const Route = createFileRoute('/_private/invoices')({
  component: InvoicesPage,
})
