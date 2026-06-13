import { createFileRoute } from '@tanstack/react-router'

import { ExpenseCreatePage } from '@/pages/expenses/create/page'

export const Route = createFileRoute('/_private/expenses/new')({
  component: ExpenseCreatePage,
})
