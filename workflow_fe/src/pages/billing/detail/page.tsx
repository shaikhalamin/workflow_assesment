import { Link,useParams } from '@tanstack/react-router'
import {
ArrowLeft,
Pencil
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/features/auth/auth-routing'
import type {
BillingRequestResponseDto,
WorkflowInstanceResponseDto
} from '@/lib/api/gen'
import { useBillingControllerFindOne,useWorkflowRuntimeControllerFindOne } from '@/lib/api/gen'
import {
formatDate,
formatValue,
unwrapData
} from '@/lib/format'
import {
EmptyState,
ErrorNotice,
PageHeader,
SectionHeading,
SummaryValue,
WorkflowProgressSection
} from '@/pages/utils/page-components'
import {
describeUserReference,
formatOptionalDate,
moneyLabel,
workflowIdFromBilling
} from '@/pages/utils/page-helpers'
import { useAuthStore } from '@/stores/auth-store'

export function BillingDetailPage() {
  const user = useAuthStore((state) => state.user)
  const { billingId } = useParams({ strict: false }) as { billingId: string }
  const query = useBillingControllerFindOne({ id: billingId })
  const billing = unwrapData(query.data) as BillingRequestResponseDto | undefined
  const workflowId = billing ? workflowIdFromBilling(billing) : undefined
  const workflowQuery = useWorkflowRuntimeControllerFindOne({ id: workflowId })
  const workflow = workflowId
    ? (unwrapData(workflowQuery.data) as WorkflowInstanceResponseDto | undefined)
    : undefined
  const isRequester = billing?.requesterId === user?.id
  const canWriteBilling = hasPermission(
    user?.roles ?? [],
    user?.permissions ?? [],
    'billing.write',
  )
  const canEditDraft = canWriteBilling && isRequester && billing?.status === 'DRAFT'
  const canEditAndResubmit =
    canWriteBilling && isRequester && billing?.status === 'REJECTED' && billing.canResubmit === true
  const canEdit = canEditDraft || canEditAndResubmit

  return (
    <>
      <PageHeader
        title={billing?.title ?? `Billing ${billingId}`}
        kicker="Billing detail"
        navigation={
          <Link
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
            to="/billing"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to billing
          </Link>
        }
        action={
          canEdit || workflowId || billing?.invoiceId ? (
            <div className="flex flex-wrap items-center gap-2">
              {canEdit ? (
                <Button className="border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700" type="button">
                  <Link className="inline-flex items-center gap-2" to="/billing/$billingId/edit" params={{ billingId }}>
                    <Pencil className="h-4 w-4" />
                    {canEditDraft ? 'Edit' : 'Edit and resubmit'}
                  </Link>
                </Button>
              ) : null}
              {workflowId ? (
                <Button className="border-sky-700 bg-sky-600 text-white shadow-sm hover:bg-sky-700" type="button">
                  <Link to="/workflow-instances/$instanceId" params={{ instanceId: workflowId }}>
                    Full workflow detail
                  </Link>
                </Button>
              ) : null}
              {billing?.invoiceId ? (
                <Button type="button" variant="secondary">
                  <Link to="/invoices/$invoiceId" params={{ invoiceId: billing.invoiceId }}>
                    Open invoice
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      />
      <ErrorNotice error={query.error ?? workflowQuery.error} />
      {billing ? (
        <div className="space-y-5">
          <BillingSummary billing={billing} />
          {workflowId ? (
            workflow ? (
              <WorkflowProgressSection instance={workflow} showActions />
            ) : (
              <EmptyState message="Workflow detail is not available yet." />
            )
          ) : (
            <EmptyState message="No workflow has been started for this billing request." />
          )}
          <BillingTechnicalReference billing={billing} />
        </div>
      ) : null}
    </>
  )
}

function BillingSummary({ billing }: { billing: BillingRequestResponseDto }) {
  const requester = describeUserReference([], billing.requester ?? billing.requesterId)

  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{billing.status}</Badge>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Requester" value={formatValue(requester)} />
        <SummaryValue label="Customer" value={billing.customerName} />
        <SummaryValue label="Customer email" value={formatValue(billing.customerEmail)} />
        <SummaryValue label="Amount" value={moneyLabel(billing.amount, billing.currency)} />
        <SummaryValue label="Category" value={billing.billingCategory} />
        <SummaryValue label="Submitted" value={formatOptionalDate(billing.submittedAt)} />
        <SummaryValue label="Approved" value={formatOptionalDate(billing.approvedAt)} />
        <SummaryValue label="Rejected" value={formatOptionalDate(billing.rejectedAt)} />
        <SummaryValue label="Created" value={formatDate(billing.createdAt)} />
        <SummaryValue label="Updated" value={formatDate(billing.updatedAt)} />
      </div>
      {billing.customerAddress ? (
        <div className="mt-4 rounded-md border border-[var(--border)] bg-white p-3 text-sm leading-6 text-black">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
            Customer address
          </p>
          <p className="mt-1 text-black">{billing.customerAddress}</p>
        </div>
      ) : null}
      {billing.description ? (
        <div className="mt-4 rounded-md border border-[var(--border)] bg-white p-3 text-sm leading-6 text-black">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
            Description
          </p>
          <p className="mt-1 text-black">{billing.description}</p>
        </div>
      ) : null}
      {billing.rejectionReason ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
          Rejection reason: {billing.rejectionReason}
        </div>
      ) : null}
    </section>
  )
}

function BillingTechnicalReference({ billing }: { billing: BillingRequestResponseDto }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <SectionHeading label="Technical metadata" title="Reference" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Billing request ID" value={billing.id} />
        <SummaryValue label="Department" value={formatValue(billing.departmentId)} />
        <SummaryValue label="Workflow ID" value={formatValue(workflowIdFromBilling(billing))} />
        <SummaryValue label="Invoice ID" value={formatValue(billing.invoiceId)} />
      </div>
    </section>
  )
}
