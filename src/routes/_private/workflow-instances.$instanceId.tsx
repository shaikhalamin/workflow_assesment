import { createFileRoute } from '@tanstack/react-router'

import { WorkflowInstanceDetailPage } from '@/pages'

export const Route = createFileRoute('/_private/workflow-instances/$instanceId')({
  component: WorkflowInstanceDetailPage,
})
