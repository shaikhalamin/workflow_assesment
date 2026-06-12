import { createFileRoute } from '@tanstack/react-router'

import { InvoiceDetailPage } from '@/pages'

export const Route = createFileRoute('/_private/invoices/$invoiceId')({
  component: InvoiceDetailPage,
})
