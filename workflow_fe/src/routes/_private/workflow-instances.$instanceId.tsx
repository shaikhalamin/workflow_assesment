import { createFileRoute } from '@tanstack/react-router'

import { WorkflowInstanceDetailPage } from '@/pages/workflow-instances/detail/page'

export const Route = createFileRoute('/_private/workflow-instances/$instanceId')({
  component: WorkflowInstanceDetailPage,
})
