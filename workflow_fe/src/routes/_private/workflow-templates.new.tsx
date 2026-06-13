import { createFileRoute } from '@tanstack/react-router'

import { WorkflowBuilderPage } from '@/pages/workflow-templates/create/page'

export const Route = createFileRoute('/_private/workflow-templates/new')({
  component: WorkflowBuilderPage,
})
