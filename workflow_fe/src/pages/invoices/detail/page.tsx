import { Link,useParams } from '@tanstack/react-router'
import {
ArrowLeft,
Download
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
InvoiceDownloadLink
} from '@/features/invoices/invoice-pdf'
import type {
InvoiceResponseDto
} from '@/lib/api/gen'
import { useInvoicesControllerFindOne } from '@/lib/api/gen'
import {
formatDate,
formatValue,
unwrapData
} from '@/lib/format'
import {
ErrorNotice,
PageHeader,
SectionHeading,
SummaryValue
} from '@/pages/utils/page-components'
import {
describeUserReference,
formatOptionalDate,
invoicePdfDataFromUnknown,
moneyLabel
} from '@/pages/utils/page-helpers'

export function InvoiceDetailPage() {
  const { invoiceId } = useParams({ strict: false }) as { invoiceId: string }
  const query = useInvoicesControllerFindOne({ id: invoiceId })
  const invoice = unwrapData(query.data) as InvoiceResponseDto | undefined

  return (
    <>
      <PageHeader
        title={invoice?.invoiceNumber ?? `Invoice ${invoiceId}`}
        kicker="Invoice detail"
        navigation={
          <Link
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
            to="/invoices"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to invoices
          </Link>
        }
      />
      <ErrorNotice error={query.error} />
      {invoice ? (
        <div className="space-y-5">
          <InvoiceSummary invoice={invoice} />
          <InvoiceTechnicalReference invoice={invoice} />
        </div>
      ) : null}
    </>
  )
}

function InvoiceSummary({ invoice }: { invoice: InvoiceResponseDto }) {
  const requester = describeUserReference([], invoice.requester ?? invoice.requesterId)
  const invoicePdfData = invoicePdfDataFromUnknown(invoice)

  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge>{invoice.status}</Badge>
        {invoicePdfData ? (
          <InvoiceDownloadLink
            invoice={invoicePdfData}
            className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
          >
            <Download className="h-4 w-4" />
            Download invoice
          </InvoiceDownloadLink>
        ) : null}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Requester" value={formatValue(requester)} />
        <SummaryValue label="Title" value={invoice.title} />
        <SummaryValue label="Customer" value={invoice.customerName} />
        <SummaryValue label="Customer email" value={formatValue(invoice.customerEmail)} />
        <SummaryValue label="Amount" value={moneyLabel(invoice.amount, invoice.currency)} />
        <SummaryValue label="Due date" value={invoice.dueDate} />
        <SummaryValue label="Issued" value={formatDate(invoice.issuedAt)} />
        <SummaryValue label="Paid" value={formatOptionalDate(invoice.paidAt)} />
        <SummaryValue label="Cancelled" value={formatOptionalDate(invoice.cancelledAt)} />
      </div>
      {invoice.customerAddress ? (
        <div className="mt-4 rounded-md border border-[var(--border)] bg-white p-3 text-sm leading-6 text-black">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
            Customer address
          </p>
          <p className="mt-1 text-black">{invoice.customerAddress}</p>
        </div>
      ) : null}
      {invoice.description ? (
        <div className="mt-4 rounded-md border border-[var(--border)] bg-white p-3 text-sm leading-6 text-black">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
            Description
          </p>
          <p className="mt-1 text-black">{invoice.description}</p>
        </div>
      ) : null}
    </section>
  )
}

function InvoiceTechnicalReference({ invoice }: { invoice: InvoiceResponseDto }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <SectionHeading label="Technical metadata" title="Reference" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Invoice ID" value={invoice.id} />
        <SummaryValue label="Billing request ID" value={invoice.billingRequestId} />
        <SummaryValue label="Department" value={formatValue(invoice.departmentId)} />
        <SummaryValue label="Created" value={formatDate(invoice.createdAt)} />
        <SummaryValue label="Updated" value={formatDate(invoice.updatedAt)} />
      </div>
    </section>
  )
}
