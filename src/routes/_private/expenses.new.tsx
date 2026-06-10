import { createFileRoute } from '@tanstack/react-router'

import { ExpenseCreatePage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/expenses/new')({
  component: ExpenseCreatePage,
})
