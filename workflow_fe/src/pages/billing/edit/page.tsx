import { useNavigate,useParams } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'

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
billingFormSchema,
fieldError,
toResubmitBillingPayload
} from '@/pages/utils/form-validation'
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
  const form = useForm({
    defaultValues: {
      title: billing.title,
      customerName: billing.customerName,
      customerEmail: billing.customerEmail ?? '',
      customerAddress: billing.customerAddress ?? '',
      amount: String(billing.amount),
      currency: billing.currency,
      billingCategory: billing.billingCategory,
      description: billing.description ?? '',
    },
    validators: {
      onSubmit: billingFormSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit(toResubmitBillingPayload(value))
    },
  })

  return (
    <CreatePanel
      title="Edit billing"
      kicker="Rejected request"
      description="Update the rejected billing request before sending it back through workflow."
      error={error}
      onSubmit={() => void form.handleSubmit()}
      submitLabel={isPending ? 'Resubmitting...' : 'Resubmit billing'}
    >
      <FormSection index="01" title="Billing details">
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
  )
}
