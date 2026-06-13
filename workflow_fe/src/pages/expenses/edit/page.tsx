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
  const [form, setForm] = useState({
    title: expense.title,
    amount: String(expense.amount),
    category: expense.category,
    description: readableValue(expense.description) ?? '',
    currency: expense.currency,
    vendor: readableValue(expense.vendor) ?? expenseVendorOptions[0],
  })
  const expensePayload: ResubmitExpenseDto = {
    title: form.title,
    amount: Number(form.amount),
    category: form.category,
    currency: form.currency,
    description: form.description || undefined,
    vendor: form.vendor || undefined,
  }

  return (
    <CreatePanel
      title="Edit expense"
      kicker="Rejected request"
      description="Update the rejected request details before sending it back through workflow."
      error={error}
      onSubmit={() => onSubmit(expensePayload)}
      submitLabel={isPending ? 'Resubmitting...' : 'Resubmit expense'}
    >
      <FormSection index="01" title="Expense details" hint="Required for approval routing.">
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Title" htmlFor="expense-title">
            <FormInput
              id="expense-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </FormField>
          <FormField label="Amount" htmlFor="expense-amount">
            <FormInput
              id="expense-amount"
              type="number"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </FormField>
          <FormField label="Currency" htmlFor="expense-currency">
            <FormInput
              id="expense-currency"
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value })}
            />
          </FormField>
        </div>
      </FormSection>
      <FormSection index="02" title="Vendor and category">
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Category" htmlFor="expense-category">
            <FormSelect
              id="expense-category"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {expenseCategoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Vendor" htmlFor="expense-vendor">
            <FormSelect
              id="expense-vendor"
              value={form.vendor}
              onChange={(event) => setForm({ ...form, vendor: event.target.value })}
            >
              {expenseVendorOptions.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </FormSelect>
          </FormField>
        </div>
      </FormSection>
      <FormSection index="03" title="Notes">
        <FormField label="Description" htmlFor="expense-description">
          <FormTextarea
            id="expense-description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </FormField>
      </FormSection>
    </CreatePanel>
  )
}
