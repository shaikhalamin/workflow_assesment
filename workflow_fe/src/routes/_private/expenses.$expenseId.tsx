import { createFileRoute } from '@tanstack/react-router'

import { ExpenseDetailPage } from '@/pages/expenses/detail/page'

export const Route = createFileRoute('/_private/expenses/$expenseId')({
  component: ExpenseDetailPage,
})
