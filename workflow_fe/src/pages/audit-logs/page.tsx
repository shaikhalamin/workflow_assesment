
import { useAuditLogsControllerList } from '@/lib/api/gen'
import {
unwrapData
} from '@/lib/format'
import {
AuditTable,
ErrorNotice,
PageHeader
} from '@/pages/utils/page-components'
import {
type Row
} from '@/pages/utils/page-helpers'

export function AuditLogsPage() {
  const query = useAuditLogsControllerList({ params: { page: 1, limit: 50 } })
  return (
    <>
      <PageHeader title="Audit logs" kicker="History" />
      <ErrorNotice error={query.error} />
      <AuditTable rows={(unwrapData(query.data) as Row[] | undefined) ?? []} />
    </>
  )
}
