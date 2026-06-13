import { Link,useNavigate,useParams } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import {
ArrowLeft
} from 'lucide-react'

import {
FormField,
FormInput,
FormSection,
FormSelect,
FormTextarea
} from '@/components/form'
import { hasPermission } from '@/features/auth/auth-routing'
import type {
BillingRequestResponseDto,
ResubmitBillingRequestDto
} from '@/lib/api/gen'
import { useBillingControllerFindOne,useBillingControllerResubmit,useBillingControllerUpdate } from '@/lib/api/gen'
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
toResubmitBillingPayload,
toUpdateBillingPayload
} from '@/pages/utils/form-validation'
import {
billingCategoryOptions
} from '@/pages/utils/page-helpers'
import { useAuthStore } from '@/stores/auth-store'

export function BillingEditPage() {
  const user = useAuthStore((state) => state.user)
  const { billingId } = useParams({ strict: false }) as { billingId: string }
  const navigate = useNavigate()
  const query = useBillingControllerFindOne({ id: billingId })
  const billing = unwrapData(query.data) as BillingRequestResponseDto | undefined
  const resubmitBilling = useBillingControllerResubmit({
    mutation: {
      onSuccess: async () => navigate({ to: '/billing/$billingId', params: { billingId } }),
    },
  })
  const updateBilling = useBillingControllerUpdate({
    mutation: {
      onSuccess: async () => navigate({ to: '/billing/$billingId', params: { billingId } }),
    },
  })
  const isRequester = billing?.requesterId === user?.id
  const canWriteBilling = hasPermission(
    user?.roles ?? [],
    user?.permissions ?? [],
    'billing.write',
  )
  const isDraftEditable = canWriteBilling && isRequester && billing?.status === 'DRAFT'
  const isRejectedEditable =
    canWriteBilling && isRequester && billing?.status === 'REJECTED' && billing.canResubmit === true
  const isEditable = isDraftEditable || isRejectedEditable

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={billing ? `Edit ${billing.title}` : `Edit billing ${billingId}`}
        kicker="Billing request"
        navigation={
          <Link
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
            to="/billing"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to billing
          </Link>
        }
      />
      <ErrorNotice error={query.error} />
      {billing && !isEditable ? (
        <EmptyState message="This billing request cannot be edited." />
      ) : null}
      {billing && isEditable ? (
        <BillingEditForm
          billing={billing}
          error={updateBilling.error ?? resubmitBilling.error}
          isPending={updateBilling.isPending || resubmitBilling.isPending}
          mode={isDraftEditable ? 'draft' : 'rejected'}
          onSubmit={(data) => {
            if (isDraftEditable) {
              updateBilling.mutate({ id: billingId, data })
              return
            }
            resubmitBilling.mutate({ id: billingId, data })
          }}
        />
      ) : null}
    </div>
  )
}

function BillingEditForm({
  billing,
  error,
  isPending,
  mode,
  onSubmit,
}: {
  billing: BillingRequestResponseDto
  error: unknown
  isPending: boolean
  mode: 'draft' | 'rejected'
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
      onSubmit(mode === 'draft' ? toUpdateBillingPayload(value) : toResubmitBillingPayload(value))
    },
  })

  return (
    <CreatePanel
      title="Edit billing"
      kicker={mode === 'draft' ? 'Draft request' : 'Rejected request'}
      description={
        mode === 'draft'
          ? 'Update the draft billing request before submitting it for approval.'
          : 'Update the rejected billing request before sending it back through workflow.'
      }
      error={error}
      onSubmit={() => void form.handleSubmit()}
      submitLabel={mode === 'draft' ? (isPending ? 'Saving...' : 'Save billing') : (isPending ? 'Resubmitting...' : 'Resubmit billing')}
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
