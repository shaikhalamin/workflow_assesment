import { createFileRoute } from '@tanstack/react-router'

import { WorkflowTemplateDetailPage } from '@/pages/workflow-templates/detail/page'

export const Route = createFileRoute('/_private/workflow-templates/$templateId')({
  component: WorkflowTemplateDetailPage,
})
