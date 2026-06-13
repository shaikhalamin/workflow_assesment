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
ExpenseResponseDto,
ResubmitExpenseDto
} from '@/lib/api/gen'
import { useExpensesControllerFindOne,useExpensesControllerResubmit } from '@/lib/api/gen'
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
expenseFormSchema,
fieldError,
toResubmitExpensePayload
} from '@/pages/utils/form-validation'
import {
expenseCategoryOptions,
expenseVendorOptions,
readableValue
} from '@/pages/utils/page-helpers'

export function ExpenseEditPage() {
  const { expenseId } = useParams({ strict: false }) as { expenseId: string }
  const navigate = useNavigate()
  const query = useExpensesControllerFindOne({ id: expenseId })
  const expense = unwrapData(query.data) as ExpenseResponseDto | undefined
  const resubmitExpense = useExpensesControllerResubmit({
    mutation: {
      onSuccess: async () => navigate({ to: '/expenses/$expenseId', params: { expenseId } }),
    },
  })
  const isEditable = expense?.status === 'REJECTED' && expense.canResubmit === true

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={expense ? `Edit ${expense.title}` : `Edit expense ${expenseId}`}
        kicker="Expense request"
      />
      <ErrorNotice error={query.error ?? resubmitExpense.error} />
      {expense && !isEditable ? (
        <EmptyState message="This expense cannot be edited and resubmitted." />
      ) : null}
      {expense && isEditable ? (
        <ExpenseEditForm
          expense={expense}
          error={resubmitExpense.error}
          isPending={resubmitExpense.isPending}
          onSubmit={(data) => resubmitExpense.mutate({ id: expenseId, data })}
        />
      ) : null}
    </div>
  )
}

function ExpenseEditForm({
  expense,
  error,
  isPending,
  onSubmit,
}: {
  expense: ExpenseResponseDto
  error: unknown
  isPending: boolean
  onSubmit: (data: ResubmitExpenseDto) => void
}) {
  const form = useForm({
    defaultValues: {
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      description: readableValue(expense.description) ?? '',
      currency: expense.currency,
      vendor: readableValue(expense.vendor) ?? expenseVendorOptions[0],
    },
    validators: {
      onSubmit: expenseFormSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit(toResubmitExpensePayload(value))
    },
  })

  return (
    <CreatePanel
      title="Edit expense"
      kicker="Rejected request"
      description="Update the rejected request details before sending it back through workflow."
      error={error}
      onSubmit={() => void form.handleSubmit()}
      submitLabel={isPending ? 'Resubmitting...' : 'Resubmit expense'}
    >
      <FormSection index="01" title="Expense details" hint="Required for approval routing.">
        <div className="grid gap-3 md:grid-cols-2">
          <form.Field name="title">
            {(field) => (
              <FormField label="Title" htmlFor="expense-title" error={fieldError(field.state.meta.errors)}>
                <FormInput
                  id="expense-title"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            )}
          </form.Field>
          <form.Field name="amount">
            {(field) => (
              <FormField label="Amount" htmlFor="expense-amount" error={fieldError(field.state.meta.errors)}>
                <FormInput
                  id="expense-amount"
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            )}
          </form.Field>
          <form.Field name="currency">
            {(field) => (
              <FormField label="Currency" htmlFor="expense-currency" error={fieldError(field.state.meta.errors)}>
                <FormInput
                  id="expense-currency"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            )}
          </form.Field>
        </div>
      </FormSection>
      <FormSection index="02" title="Vendor and category">
        <div className="grid gap-3 md:grid-cols-2">
          <form.Field name="category">
            {(field) => (
              <FormField label="Category" htmlFor="expense-category" error={fieldError(field.state.meta.errors)}>
                <FormSelect
                  id="expense-category"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                >
                  {expenseCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </FormSelect>
              </FormField>
            )}
          </form.Field>
          <form.Field name="vendor">
            {(field) => (
              <FormField label="Vendor" htmlFor="expense-vendor" error={fieldError(field.state.meta.errors)}>
                <FormSelect
                  id="expense-vendor"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                >
                  {expenseVendorOptions.map((vendor) => (
                    <option key={vendor} value={vendor}>
                      {vendor}
                    </option>
                  ))}
                </FormSelect>
              </FormField>
            )}
          </form.Field>
        </div>
      </FormSection>
      <FormSection index="03" title="Notes">
        <form.Field name="description">
          {(field) => (
            <FormField label="Description" htmlFor="expense-description" error={fieldError(field.state.meta.errors)}>
              <FormTextarea
                id="expense-description"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </FormField>
          )}
        </form.Field>
      </FormSection>
    </CreatePanel>
  )
}
