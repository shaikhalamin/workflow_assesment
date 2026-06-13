import { createFileRoute } from '@tanstack/react-router'

import { WorkflowTemplateDetailPage } from '@/pages'

export const Route = createFileRoute('/_private/workflow-templates/$templateId')({
  component: WorkflowTemplateDetailPage,
})
