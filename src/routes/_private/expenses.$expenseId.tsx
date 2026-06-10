import { createFileRoute } from '@tanstack/react-router'

import { ExpenseDetailPage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/expenses/$expenseId')({
  component: ExpenseDetailPage,
})
