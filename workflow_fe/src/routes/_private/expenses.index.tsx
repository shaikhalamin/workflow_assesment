import { createFileRoute } from '@tanstack/react-router'

import { ExpensesPage } from '@/pages/expenses/list/page'

export const Route = createFileRoute('/_private/expenses/')({
  component: ExpensesPage,
})
