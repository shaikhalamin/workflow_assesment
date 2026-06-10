import { createFileRoute } from '@tanstack/react-router'

import { ExpensesPage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/expenses/')({
  component: ExpensesPage,
})
