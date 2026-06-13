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
ExpenseResponseDto,
ResubmitExpenseDto
} from '@/lib/api/gen'
import { useExpensesControllerFindOne,useExpensesControllerResubmit,useExpensesControllerUpdate } from '@/lib/api/gen'
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
toResubmitExpensePayload,
toUpdateExpensePayload
} from '@/pages/utils/form-validation'
import {
expenseCategoryOptions,
expenseVendorOptions,
readableValue
} from '@/pages/utils/page-helpers'
import { useAuthStore } from '@/stores/auth-store'

export function ExpenseEditPage() {
  const user = useAuthStore((state) => state.user)
  const { expenseId } = useParams({ strict: false }) as { expenseId: string }
  const navigate = useNavigate()
  const query = useExpensesControllerFindOne({ id: expenseId })
  const expense = unwrapData(query.data) as ExpenseResponseDto | undefined
  const resubmitExpense = useExpensesControllerResubmit({
    mutation: {
      onSuccess: async () => navigate({ to: '/expenses/$expenseId', params: { expenseId } }),
    },
  })
  const updateExpense = useExpensesControllerUpdate({
    mutation: {
      onSuccess: async () => navigate({ to: '/expenses/$expenseId', params: { expenseId } }),
    },
  })
  const isRequester = expense?.requesterId === user?.id
  const canWriteExpenses = hasPermission(
    user?.roles ?? [],
    user?.permissions ?? [],
    'expenses.write',
  )
  const isDraftEditable = canWriteExpenses && isRequester && expense?.status === 'DRAFT'
  const isRejectedEditable =
    canWriteExpenses && isRequester && expense?.status === 'REJECTED' && expense.canResubmit === true
  const isEditable = isDraftEditable || isRejectedEditable

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={expense ? `Edit ${expense.title}` : `Edit expense ${expenseId}`}
        kicker="Expense request"
        navigation={
          <Link
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
            to="/expenses"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to expenses
          </Link>
        }
      />
      <ErrorNotice error={query.error} />
      {expense && !isEditable ? (
        <EmptyState message="This expense cannot be edited." />
      ) : null}
      {expense && isEditable ? (
        <ExpenseEditForm
          expense={expense}
          error={updateExpense.error ?? resubmitExpense.error}
          isPending={updateExpense.isPending || resubmitExpense.isPending}
          mode={isDraftEditable ? 'draft' : 'rejected'}
          onSubmit={(data) => {
            if (isDraftEditable) {
              updateExpense.mutate({ id: expenseId, data })
              return
            }
            resubmitExpense.mutate({ id: expenseId, data })
          }}
        />
      ) : null}
    </div>
  )
}

function ExpenseEditForm({
  expense,
  error,
  isPending,
  mode,
  onSubmit,
}: {
  expense: ExpenseResponseDto
  error: unknown
  isPending: boolean
  mode: 'draft' | 'rejected'
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
      onSubmit(mode === 'draft' ? toUpdateExpensePayload(value) : toResubmitExpensePayload(value))
    },
  })

  return (
    <CreatePanel
      title="Edit expense"
      kicker={mode === 'draft' ? 'Draft request' : 'Rejected request'}
      description={
        mode === 'draft'
          ? 'Update the draft request details before submitting it for approval.'
          : 'Update the rejected request details before sending it back through workflow.'
      }
      error={error}
      onSubmit={() => void form.handleSubmit()}
      submitLabel={mode === 'draft' ? (isPending ? 'Saving...' : 'Save expense') : (isPending ? 'Resubmitting...' : 'Resubmit expense')}
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
