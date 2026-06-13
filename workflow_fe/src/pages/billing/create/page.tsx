import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import {
FormField,
FormInput,
FormSection,
FormSelect,
FormTextarea
} from '@/components/form'
import type {
CreateBillingRequestDto
} from '@/lib/api/gen'
import { useBillingControllerCreate } from '@/lib/api/gen'
import {
CreatePanel
} from '@/pages/utils/page-components'
import {
billingCategoryOptions
} from '@/pages/utils/page-helpers'

export function BillingCreatePage() {
  const navigate = useNavigate()
  const createBilling = useBillingControllerCreate({ mutation: { onSuccess: async () => navigate({ to: '/billing' }) } })
  const [form, setForm] = useState({
    title: '',
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    amount: '',
    currency: 'BDT',
    billingCategory: billingCategoryOptions[0],
    description: '',
  })
  const billingPayload: CreateBillingRequestDto = {
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
    <div className="max-w-3xl">
      <CreatePanel
        title="New billing"
        kicker="Billing request"
        description="Capture customer, billing category, and amount before sending through workflow."
        error={createBilling.error}
        onSubmit={() => createBilling.mutate({ data: billingPayload })}
        submitLabel={createBilling.isPending ? 'Saving...' : 'Save billing request'}
      >
        <FormSection index="01" title="Billing details" hint="Required for approval routing.">
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
    </div>
  )
}
