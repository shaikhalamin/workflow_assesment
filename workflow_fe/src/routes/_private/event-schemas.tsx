import { createFileRoute } from '@tanstack/react-router'

import { EventSchemasPage } from '@/pages/event-schemas/page'

export const Route = createFileRoute('/_private/event-schemas')({
  component: EventSchemasPage,
})
