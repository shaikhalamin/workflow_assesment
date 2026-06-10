import { createFileRoute } from '@tanstack/react-router'

import { WorkflowTemplatesPage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/workflow-templates/')({
  component: WorkflowTemplatesPage,
})
