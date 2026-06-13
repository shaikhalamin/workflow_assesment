import { createFileRoute } from '@tanstack/react-router'

import { WorkflowTemplateEditPage } from '@/pages/workflow-templates/create/page'

export const Route = createFileRoute('/_private/workflow-templates_/$templateId/edit')({
  component: WorkflowTemplateEditPage,
})
