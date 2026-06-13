import { createFileRoute } from '@tanstack/react-router'

import { WorkflowTemplatesPage } from '@/pages/workflow-templates/list/page'

export const Route = createFileRoute('/_private/workflow-templates/')({
  component: WorkflowTemplatesPage,
})
