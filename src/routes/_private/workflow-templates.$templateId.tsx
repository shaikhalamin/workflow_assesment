import { createFileRoute } from '@tanstack/react-router'

import { WorkflowTemplateDetailPage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/workflow-templates/$templateId')({
  component: WorkflowTemplateDetailPage,
})
