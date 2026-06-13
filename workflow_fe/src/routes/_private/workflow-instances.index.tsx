import { createFileRoute } from '@tanstack/react-router'

import { WorkflowInstancesPage } from '@/pages'

export const Route = createFileRoute('/_private/workflow-instances/')({
  component: WorkflowInstancesPage,
})
