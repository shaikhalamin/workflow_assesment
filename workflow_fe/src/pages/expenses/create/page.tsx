import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'

import {
FormField,
FormInput,
FormSection,
FormSelect,
FormTextarea
} from '@/components/form'
import { useExpensesControllerCreate } from '@/lib/api/gen'
import {
CreatePanel
} from '@/pages/utils/page-components'
import {
expenseFormSchema,
fieldError,
toCreateExpensePayload
} from '@/pages/utils/form-validation'
import {
expenseCategoryOptions,
expenseVendorOptions
} from '@/pages/utils/page-helpers'

export function ExpenseCreatePage() {
  const navigate = useNavigate()
  const createExpense = useExpensesControllerCreate({ mutation: { onSuccess: async () => navigate({ to: '/expenses' }) } })
  const form = useForm({
    defaultValues: {
      title: '',
      amount: '',
      category: expenseCategoryOptions[0],
      description: '',
      currency: 'BDT',
      vendor: expenseVendorOptions[0],
    },
    validators: {
      onSubmit: expenseFormSchema,
    },
    onSubmit: ({ value }) => {
      createExpense.mutate({ data: toCreateExpensePayload(value) })
    },
  })

  return (
    <div className="max-w-3xl">
      <CreatePanel
        title="New expense"
        kicker="Expense request"
        description="Capture request details, vendor context, and notes before submitting for approval."
        error={createExpense.error}
        onSubmit={() => void form.handleSubmit()}
        submitLabel={createExpense.isPending ? 'Saving...' : 'Save expense'}
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
    </div>
  )
}
