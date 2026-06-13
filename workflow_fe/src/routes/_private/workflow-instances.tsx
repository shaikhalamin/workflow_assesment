import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_private/workflow-instances')({
  component: Outlet,
})
