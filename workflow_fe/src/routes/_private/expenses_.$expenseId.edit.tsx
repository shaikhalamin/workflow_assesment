import { createFileRoute } from '@tanstack/react-router'

import { ExpenseEditPage } from '@/pages'

export const Route = createFileRoute('/_private/expenses_/$expenseId/edit')({
  component: ExpenseEditPage,
})
