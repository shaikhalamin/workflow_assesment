import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_private/expenses')({
  component: Outlet,
})
