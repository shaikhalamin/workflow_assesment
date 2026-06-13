import { createFileRoute } from '@tanstack/react-router'

import { ExpenseEditPage } from '@/pages/expenses/edit/page'

export const Route = createFileRoute('/_private/expenses_/$expenseId/edit')({
  component: ExpenseEditPage,
})
