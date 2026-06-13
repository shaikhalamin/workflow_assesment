import { useNavigate,useParams } from '@tanstack/react-router'
import { useState } from 'react'

import {
FormField,
FormInput,
FormSection,
FormSelect,
FormTextarea
} from '@/components/form'
import type {
LeaveResponseDto,
ResubmitLeaveDto
} from '@/lib/api/gen'
import { useLeavesControllerFindOne,useLeavesControllerResubmit } from '@/lib/api/gen'
import {
unwrapData
} from '@/lib/format'
import {
CreatePanel,
EmptyState,
ErrorNotice,
PageHeader
} from '@/pages/utils/page-components'

export function LeaveEditPage() {
  const { leaveId } = useParams({ strict: false }) as { leaveId: string }
  const navigate = useNavigate()
  const query = useLeavesControllerFindOne({ id: leaveId })
  const leave = unwrapData(query.data) as LeaveResponseDto | undefined
  const resubmitLeave = useLeavesControllerResubmit({
    mutation: {
      onSuccess: async () => navigate({ to: '/leaves/$leaveId', params: { leaveId } }),
    },
  })
  const isEditable = leave?.status === 'REJECTED' && leave.canResubmit === true

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={leave ? `Edit ${leave.leaveType} leave` : `Edit leave ${leaveId}`}
        kicker="Leave request"
      />
      <ErrorNotice error={query.error ?? resubmitLeave.error} />
      {leave && !isEditable ? (
        <EmptyState message="This leave request cannot be edited and resubmitted." />
      ) : null}
      {leave && isEditable ? (
        <LeaveEditForm
          error={resubmitLeave.error}
          isPending={resubmitLeave.isPending}
          leave={leave}
          onSubmit={(data) => resubmitLeave.mutate({ id: leaveId, data })}
        />
      ) : null}
    </div>
  )
}

function LeaveEditForm({
  error,
  isPending,
  leave,
  onSubmit,
}: {
  error: unknown
  isPending: boolean
  leave: LeaveResponseDto
  onSubmit: (data: ResubmitLeaveDto) => void
}) {
  const [form, setForm] = useState({
    leaveType: leave.leaveType,
    leaveDays: leave.leaveDays,
    startDate: leave.startDate,
    endDate: leave.endDate,
    reason: leave.reason ?? '',
  })
  const leavePayload: ResubmitLeaveDto = {
    leaveType: form.leaveType,
    leaveDays: form.leaveDays,
    startDate: form.startDate,
    endDate: form.endDate,
    reason: form.reason || undefined,
  }

  return (
    <CreatePanel
      title="Edit leave"
      kicker="Rejected request"
      description="Update leave type, dates, duration, and reason before sending it back through workflow."
      error={error}
      onSubmit={() => onSubmit(leavePayload)}
      submitLabel={isPending ? 'Resubmitting...' : 'Resubmit leave'}
    >
      <FormSection index="01" title="Leave type">
        <FormField label="Type" htmlFor="leave-type">
          <FormSelect
            id="leave-type"
            value={form.leaveType}
            onChange={(event) => setForm({ ...form, leaveType: event.target.value })}
          >
            <option value="ANNUAL">Annual</option>
            <option value="SICK">Sick</option>
            <option value="CASUAL">Casual</option>
            <option value="UNPAID">Unpaid</option>
          </FormSelect>
        </FormField>
      </FormSection>
      <FormSection index="02" title="Dates and duration">
        <div className="grid gap-3 md:grid-cols-3">
          <FormField label="Start date" htmlFor="leave-start-date">
            <FormInput
              id="leave-start-date"
              type="date"
              value={form.startDate}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            />
          </FormField>
          <FormField label="End date" htmlFor="leave-end-date">
            <FormInput
              id="leave-end-date"
              type="date"
              value={form.endDate}
              onChange={(event) => setForm({ ...form, endDate: event.target.value })}
            />
          </FormField>
          <FormField label="Leave days" htmlFor="leave-days">
            <FormInput
              id="leave-days"
              type="number"
              value={form.leaveDays}
              onChange={(event) => setForm({ ...form, leaveDays: Number(event.target.value) })}
            />
          </FormField>
        </div>
      </FormSection>
      <FormSection index="03" title="Reason">
        <FormField label="Reason" htmlFor="leave-reason">
          <FormTextarea
            id="leave-reason"
            value={form.reason}
            onChange={(event) => setForm({ ...form, reason: event.target.value })}
          />
        </FormField>
      </FormSection>
    </CreatePanel>
  )
}
