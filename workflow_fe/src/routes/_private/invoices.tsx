import { createFileRoute } from '@tanstack/react-router'

import { InvoicesPage } from '@/pages/invoices/list/page'

export const Route = createFileRoute('/_private/invoices')({
  component: InvoicesPage,
})
