import { createFileRoute } from '@tanstack/react-router'

import { WorkflowInstancesPage } from '@/pages/workflow-instances/list/page'

export const Route = createFileRoute('/_private/workflow-instances/')({
  component: WorkflowInstancesPage,
})
