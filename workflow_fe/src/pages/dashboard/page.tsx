import { useState } from 'react'

import {
FormField,
FormInput
} from '@/components/form'
import { Button } from '@/components/ui/button'
import { useDashboardControllerAdmin } from '@/lib/api/gen'
import {
unwrapData
} from '@/lib/format'
import {
ErrorNotice,
Metric,
PageHeader,
RecentActivityList,
StatusBars
} from '@/pages/utils/page-components'
import {
dateInputValue
} from '@/pages/utils/page-helpers'

export function DashboardPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const admin = useDashboardControllerAdmin({
    params: {
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    },
  })
  const adminData = unwrapData(admin.data)
  const workflows = adminData?.workflows
  const billing = adminData?.billing
  const invoices = adminData?.invoices
  const payments = adminData?.payments
  const workflowItems = [
    {
      label: 'Active',
      value: workflows?.active ?? 0,
      className: 'bg-teal-600',
    },
    {
      label: 'Approved',
      value: workflows?.approved ?? 0,
      className: 'bg-emerald-600',
    },
    {
      label: 'Rejected',
      value: workflows?.rejected ?? 0,
      className: 'bg-rose-600',
    },
    {
      label: 'Failed',
      value: workflows?.failed ?? 0,
      className: 'bg-amber-600',
    },
  ]
  const billingItems = [
    { label: 'Draft', value: billing?.draft ?? 0, className: 'bg-slate-500' },
    {
      label: 'Submitted',
      value: billing?.submitted ?? 0,
      className: 'bg-sky-600',
    },
    {
      label: 'Under review',
      value: billing?.underReview ?? 0,
      className: 'bg-amber-600',
    },
    {
      label: 'Approved',
      value: billing?.approved ?? 0,
      className: 'bg-emerald-600',
    },
    {
      label: 'Rejected',
      value: billing?.rejected ?? 0,
      className: 'bg-rose-600',
    },
    {
      label: 'Invoiced',
      value: billing?.invoiced ?? 0,
      className: 'bg-indigo-600',
    },
    {
      label: 'Cancelled',
      value: billing?.cancelled ?? 0,
      className: 'bg-zinc-500',
    },
  ]
  const invoiceItems = [
    { label: 'Issued', value: invoices?.issued ?? 0, className: 'bg-blue-600' },
    { label: 'Paid', value: invoices?.paid ?? 0, className: 'bg-emerald-600' },
    {
      label: 'Cancelled',
      value: invoices?.cancelled ?? 0,
      className: 'bg-zinc-500',
    },
  ]
  const paymentItems = [
    {
      label: 'Pending',
      value: payments?.pending ?? 0,
      className: 'bg-amber-600',
    },
    { label: 'Paid', value: payments?.paid ?? 0, className: 'bg-emerald-600' },
    {
      label: 'Cancelled',
      value: payments?.cancelled ?? 0,
      className: 'bg-zinc-500',
    },
  ]

  const setLastThirtyDays = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 29)
    setFrom(dateInputValue(start))
    setTo(dateInputValue(end))
  }

  const clearFilters = () => {
    setFrom('')
    setTo('')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Operations"
        title="Executive Operations Summary"
        description="Management view across workflows, billing, invoices, payments, failed triggers, and recent activity."
      />
      <ErrorNotice error={admin.error} />
      <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <FormField label="From" htmlFor="dashboard-from">
              <FormInput
                id="dashboard-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </FormField>
          </div>
          <div className="min-w-[180px] flex-1">
            <FormField label="To" htmlFor="dashboard-to">
              <FormInput
                id="dashboard-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-2 pb-0.5">
            <Button type="button" variant="secondary" onClick={setLastThirtyDays}>
              Last 30 days
            </Button>
            <Button type="button" variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </section>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active workflows" value={workflows?.active} tone="success" />
        <Metric label="Approved workflows" value={workflows?.approved} tone="success" />
        <Metric label="Rejected workflows" value={workflows?.rejected} />
        <Metric label="Failed workflows" value={workflows?.failed} tone="warning" />
        <Metric label="Billing under review" value={billing?.underReview} />
        <Metric label="Issued invoices" value={invoices?.issued} />
        <Metric label="Paid invoices" value={invoices?.paid} tone="success" />
        <Metric label="Pending payments" value={payments?.pending} tone="warning" />
        <Metric label="Failed triggers" value={adminData?.failedTriggers} tone="warning" />
      </div>
      {admin.isLoading ? (
        <p className="rounded-lg border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted-foreground)]">
          Loading executive summary...
        </p>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <StatusBars title="Workflow status" items={workflowItems} />
        <StatusBars title="Billing requests" items={billingItems} />
        <StatusBars title="Invoice status" items={invoiceItems} />
        <StatusBars title="Payment status" items={paymentItems} />
      </div>
      <RecentActivityList items={adminData?.recentWorkflowChanges ?? []} />
    </div>
  )
}
