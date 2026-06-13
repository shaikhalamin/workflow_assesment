import { useNavigate,useParams } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'

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
import {
fieldError,
leaveFormSchema,
toResubmitLeavePayload
} from '@/pages/utils/form-validation'

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
  const form = useForm({
    defaultValues: {
      leaveType: leave.leaveType,
      leaveDays: String(leave.leaveDays),
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason ?? '',
    },
    validators: {
      onSubmit: leaveFormSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit(toResubmitLeavePayload(value))
    },
  })

  return (
    <CreatePanel
      title="Edit leave"
      kicker="Rejected request"
      description="Update leave type, dates, duration, and reason before sending it back through workflow."
      error={error}
      onSubmit={() => void form.handleSubmit()}
      submitLabel={isPending ? 'Resubmitting...' : 'Resubmit leave'}
    >
      <FormSection index="01" title="Leave type">
        <form.Field name="leaveType">
          {(field) => (
            <FormField label="Type" htmlFor="leave-type" error={fieldError(field.state.meta.errors)}>
              <FormSelect
                id="leave-type"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              >
                <option value="ANNUAL">Annual</option>
                <option value="SICK">Sick</option>
                <option value="CASUAL">Casual</option>
                <option value="UNPAID">Unpaid</option>
              </FormSelect>
            </FormField>
          )}
        </form.Field>
      </FormSection>
      <FormSection index="02" title="Dates and duration">
        <div className="grid gap-3 md:grid-cols-3">
          <form.Field name="startDate">
            {(field) => (
              <FormField label="Start date" htmlFor="leave-start-date" error={fieldError(field.state.meta.errors)}>
                <FormInput
                  id="leave-start-date"
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            )}
          </form.Field>
          <form.Field name="endDate">
            {(field) => (
              <FormField label="End date" htmlFor="leave-end-date" error={fieldError(field.state.meta.errors)}>
                <FormInput
                  id="leave-end-date"
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            )}
          </form.Field>
          <form.Field name="leaveDays">
            {(field) => (
              <FormField label="Leave days" htmlFor="leave-days" error={fieldError(field.state.meta.errors)}>
                <FormInput
                  id="leave-days"
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            )}
          </form.Field>
        </div>
      </FormSection>
      <FormSection index="03" title="Reason">
        <form.Field name="reason">
          {(field) => (
            <FormField label="Reason" htmlFor="leave-reason" error={fieldError(field.state.meta.errors)}>
              <FormTextarea
                id="leave-reason"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </FormField>
          )}
        </form.Field>
      </FormSection>
    </CreatePanel>
  )
}
