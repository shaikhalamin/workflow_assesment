import { useNavigate,useParams } from '@tanstack/react-router'
import { useState } from 'react'

import {
FormField,
FormInput,
FormSection,
FormSelect,
FormTextarea
} from '@/components/form'
import type {
BillingRequestResponseDto,
ResubmitBillingRequestDto
} from '@/lib/api/gen'
import { useBillingControllerFindOne,useBillingControllerResubmit } from '@/lib/api/gen'
import {
unwrapData
} from '@/lib/format'
import {
CreatePanel,
EmptyState,
ErrorNotice,
PageHeader
} from '@/pages/utils/page-components'
import {
billingCategoryOptions
} from '@/pages/utils/page-helpers'

export function BillingEditPage() {
  const { billingId } = useParams({ strict: false }) as { billingId: string }
  const navigate = useNavigate()
  const query = useBillingControllerFindOne({ id: billingId })
  const billing = unwrapData(query.data) as BillingRequestResponseDto | undefined
  const resubmitBilling = useBillingControllerResubmit({
    mutation: {
      onSuccess: async () => navigate({ to: '/billing/$billingId', params: { billingId } }),
    },
  })
  const isEditable = billing?.status === 'REJECTED' && billing.canResubmit === true

  return (
    <div className="max-w-3xl">
      <PageHeader title={billing ? `Edit ${billing.title}` : `Edit billing ${billingId}`} kicker="Billing request" />
      <ErrorNotice error={query.error ?? resubmitBilling.error} />
      {billing && !isEditable ? (
        <EmptyState message="This billing request cannot be edited and resubmitted." />
      ) : null}
      {billing && isEditable ? (
        <BillingEditForm
          billing={billing}
          error={resubmitBilling.error}
          isPending={resubmitBilling.isPending}
          onSubmit={(data) => resubmitBilling.mutate({ id: billingId, data })}
        />
      ) : null}
    </div>
  )
}

function BillingEditForm({
  billing,
  error,
  isPending,
  onSubmit,
}: {
  billing: BillingRequestResponseDto
  error: unknown
  isPending: boolean
  onSubmit: (data: ResubmitBillingRequestDto) => void
}) {
  const [form, setForm] = useState({
    title: billing.title,
    customerName: billing.customerName,
    customerEmail: billing.customerEmail ?? '',
    customerAddress: billing.customerAddress ?? '',
    amount: billing.amount,
    currency: billing.currency,
    billingCategory: billing.billingCategory,
    description: billing.description ?? '',
  })
  const billingPayload: ResubmitBillingRequestDto = {
    title: form.title,
    customerName: form.customerName,
    amount: Number(form.amount),
    currency: form.currency,
    billingCategory: form.billingCategory,
    customerEmail: form.customerEmail || undefined,
    customerAddress: form.customerAddress || undefined,
    description: form.description || undefined,
  }

  return (
    <CreatePanel
      title="Edit billing"
      kicker="Rejected request"
      description="Update the rejected billing request before sending it back through workflow."
      error={error}
      onSubmit={() => onSubmit(billingPayload)}
      submitLabel={isPending ? 'Resubmitting...' : 'Resubmit billing'}
    >
      <FormSection index="01" title="Billing details">
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Title" htmlFor="billing-title">
            <FormInput id="billing-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </FormField>
          <FormField label="Customer name" htmlFor="billing-customer-name">
            <FormInput id="billing-customer-name" value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} />
          </FormField>
          <FormField label="Amount" htmlFor="billing-amount">
            <FormInput id="billing-amount" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          </FormField>
          <FormField label="Currency" htmlFor="billing-currency">
            <FormInput id="billing-currency" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} />
          </FormField>
          <FormField label="Category" htmlFor="billing-category">
            <FormSelect id="billing-category" value={form.billingCategory} onChange={(event) => setForm({ ...form, billingCategory: event.target.value })}>
              {billingCategoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Customer email" htmlFor="billing-customer-email">
            <FormInput id="billing-customer-email" type="email" value={form.customerEmail} onChange={(event) => setForm({ ...form, customerEmail: event.target.value })} />
          </FormField>
        </div>
      </FormSection>
      <FormSection index="02" title="Customer context">
        <FormField label="Customer address" htmlFor="billing-customer-address">
          <FormTextarea id="billing-customer-address" value={form.customerAddress} onChange={(event) => setForm({ ...form, customerAddress: event.target.value })} />
        </FormField>
        <FormField label="Description" htmlFor="billing-description">
          <FormTextarea id="billing-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </FormField>
      </FormSection>
    </CreatePanel>
  )
}
