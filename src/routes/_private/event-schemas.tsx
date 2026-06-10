import { createFileRoute } from '@tanstack/react-router'

import { EventSchemasPage } from '@/pages/workspace-pages'

export const Route = createFileRoute('/_private/event-schemas')({
  component: EventSchemasPage,
})
