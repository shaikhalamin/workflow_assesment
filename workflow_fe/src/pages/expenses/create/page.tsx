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
CreateExpenseDto
} from '@/lib/api/gen'
import { useExpensesControllerCreate } from '@/lib/api/gen'
import {
CreatePanel
} from '@/pages/utils/page-components'
import {
expenseCategoryOptions,
expenseVendorOptions
} from '@/pages/utils/page-helpers'

export function ExpenseCreatePage() {
  const navigate = useNavigate()
  const createExpense = useExpensesControllerCreate({ mutation: { onSuccess: async () => navigate({ to: '/expenses' }) } })
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: expenseCategoryOptions[0],
    description: '',
    currency: 'BDT',
    vendor: expenseVendorOptions[0],
  })
  const expensePayload: CreateExpenseDto = {
    title: form.title,
    amount: Number(form.amount),
    category: form.category,
    currency: form.currency,
    description: form.description || undefined,
    vendor: form.vendor || undefined,
  }

  return (
    <div className="max-w-3xl">
      <CreatePanel
        title="New expense"
        kicker="Expense request"
        description="Capture request details, vendor context, and notes before submitting for approval."
        error={createExpense.error}
        onSubmit={() => createExpense.mutate({ data: expensePayload })}
        submitLabel={createExpense.isPending ? 'Saving...' : 'Save expense'}
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
    </div>
  )
}
