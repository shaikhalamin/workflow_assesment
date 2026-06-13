import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'

import {
FormField,
FormInput,
FormSection,
FormSelect,
FormTextarea
} from '@/components/form'
import { useBillingControllerCreate } from '@/lib/api/gen'
import {
CreatePanel
} from '@/pages/utils/page-components'
import {
billingFormSchema,
fieldError,
toCreateBillingPayload
} from '@/pages/utils/form-validation'
import {
billingCategoryOptions
} from '@/pages/utils/page-helpers'

export function BillingCreatePage() {
  const navigate = useNavigate()
  const createBilling = useBillingControllerCreate({ mutation: { onSuccess: async () => navigate({ to: '/billing' }) } })
  const form = useForm({
    defaultValues: {
      title: '',
      customerName: '',
      customerEmail: '',
      customerAddress: '',
      amount: '',
      currency: 'BDT',
      billingCategory: billingCategoryOptions[0],
      description: '',
    },
    validators: {
      onSubmit: billingFormSchema,
    },
    onSubmit: ({ value }) => {
      createBilling.mutate({ data: toCreateBillingPayload(value) })
    },
  })

  return (
    <div className="max-w-3xl">
      <CreatePanel
        title="New billing"
        kicker="Billing request"
        description="Capture customer, billing category, and amount before sending through workflow."
        error={createBilling.error}
        onSubmit={() => void form.handleSubmit()}
        submitLabel={createBilling.isPending ? 'Saving...' : 'Save billing request'}
      >
        <FormSection index="01" title="Billing details" hint="Required for approval routing.">
          <div className="grid gap-3 md:grid-cols-2">
            <form.Field name="title">
              {(field) => (
                <FormField label="Title" htmlFor="billing-title" error={fieldError(field.state.meta.errors)}>
                  <FormInput id="billing-title" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} />
                </FormField>
              )}
            </form.Field>
            <form.Field name="customerName">
              {(field) => (
                <FormField label="Customer name" htmlFor="billing-customer-name" error={fieldError(field.state.meta.errors)}>
                  <FormInput id="billing-customer-name" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} />
                </FormField>
              )}
            </form.Field>
            <form.Field name="amount">
              {(field) => (
                <FormField label="Amount" htmlFor="billing-amount" error={fieldError(field.state.meta.errors)}>
                  <FormInput id="billing-amount" type="number" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} />
                </FormField>
              )}
            </form.Field>
            <form.Field name="currency">
              {(field) => (
                <FormField label="Currency" htmlFor="billing-currency" error={fieldError(field.state.meta.errors)}>
                  <FormInput id="billing-currency" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} />
                </FormField>
              )}
            </form.Field>
            <form.Field name="billingCategory">
              {(field) => (
                <FormField label="Category" htmlFor="billing-category" error={fieldError(field.state.meta.errors)}>
                  <FormSelect id="billing-category" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)}>
                    {billingCategoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>
              )}
            </form.Field>
            <form.Field name="customerEmail">
              {(field) => (
                <FormField label="Customer email" htmlFor="billing-customer-email" error={fieldError(field.state.meta.errors)}>
                  <FormInput id="billing-customer-email" type="email" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} />
                </FormField>
              )}
            </form.Field>
          </div>
        </FormSection>
        <FormSection index="02" title="Customer context">
          <form.Field name="customerAddress">
            {(field) => (
              <FormField label="Customer address" htmlFor="billing-customer-address" error={fieldError(field.state.meta.errors)}>
                <FormTextarea id="billing-customer-address" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} />
              </FormField>
            )}
          </form.Field>
          <form.Field name="description">
            {(field) => (
              <FormField label="Description" htmlFor="billing-description" error={fieldError(field.state.meta.errors)}>
                <FormTextarea id="billing-description" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} />
              </FormField>
            )}
          </form.Field>
        </FormSection>
      </CreatePanel>
    </div>
  )
}
