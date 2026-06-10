import { createFileRoute } from '@tanstack/react-router'

import { WorkflowBuilderPage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/workflow-templates/new')({
  component: WorkflowBuilderPage,
})
