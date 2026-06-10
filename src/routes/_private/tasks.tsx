import { createFileRoute } from '@tanstack/react-router'

import { TasksPage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/tasks')({
  component: TasksPage,
})
