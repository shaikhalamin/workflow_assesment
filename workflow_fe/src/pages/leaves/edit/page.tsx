import { Link,useNavigate,useParams } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import {
ArrowLeft
} from 'lucide-react'

import {
FormField,
FormInput,
FormSection,
FormSelect,
FormTextarea
} from '@/components/form'
import { hasPermission } from '@/features/auth/auth-routing'
import type {
LeaveResponseDto,
ResubmitLeaveDto
} from '@/lib/api/gen'
import { useLeavesControllerFindOne,useLeavesControllerResubmit,useLeavesControllerUpdate } from '@/lib/api/gen'
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
toResubmitLeavePayload,
toUpdateLeavePayload
} from '@/pages/utils/form-validation'
import { useAuthStore } from '@/stores/auth-store'

export function LeaveEditPage() {
  const user = useAuthStore((state) => state.user)
  const { leaveId } = useParams({ strict: false }) as { leaveId: string }
  const navigate = useNavigate()
  const query = useLeavesControllerFindOne({ id: leaveId })
  const leave = unwrapData(query.data) as LeaveResponseDto | undefined
  const resubmitLeave = useLeavesControllerResubmit({
    mutation: {
      onSuccess: async () => navigate({ to: '/leaves/$leaveId', params: { leaveId } }),
    },
  })
  const updateLeave = useLeavesControllerUpdate({
    mutation: {
      onSuccess: async () => navigate({ to: '/leaves/$leaveId', params: { leaveId } }),
    },
  })
  const isRequester = leave?.requesterId === user?.id
  const canWriteLeaves = hasPermission(
    user?.roles ?? [],
    user?.permissions ?? [],
    'leaves.write',
  )
  const isDraftEditable = canWriteLeaves && isRequester && leave?.status === 'DRAFT'
  const isRejectedEditable =
    canWriteLeaves && isRequester && leave?.status === 'REJECTED' && leave.canResubmit === true
  const isEditable = isDraftEditable || isRejectedEditable

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={leave ? `Edit ${leave.leaveType} leave` : `Edit leave ${leaveId}`}
        kicker="Leave request"
        navigation={
          <Link
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
            to="/leaves"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to leaves
          </Link>
        }
      />
      <ErrorNotice error={query.error} />
      {leave && !isEditable ? (
        <EmptyState message="This leave request cannot be edited." />
      ) : null}
      {leave && isEditable ? (
        <LeaveEditForm
          error={updateLeave.error ?? resubmitLeave.error}
          isPending={updateLeave.isPending || resubmitLeave.isPending}
          leave={leave}
          mode={isDraftEditable ? 'draft' : 'rejected'}
          onSubmit={(data) => {
            if (isDraftEditable) {
              updateLeave.mutate({ id: leaveId, data })
              return
            }
            resubmitLeave.mutate({ id: leaveId, data })
          }}
        />
      ) : null}
    </div>
  )
}

function LeaveEditForm({
  error,
  isPending,
  leave,
  mode,
  onSubmit,
}: {
  error: unknown
  isPending: boolean
  leave: LeaveResponseDto
  mode: 'draft' | 'rejected'
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
      onSubmit(mode === 'draft' ? toUpdateLeavePayload(value) : toResubmitLeavePayload(value))
    },
  })

  return (
    <CreatePanel
      title="Edit leave"
      kicker={mode === 'draft' ? 'Draft request' : 'Rejected request'}
      description={
        mode === 'draft'
          ? 'Update leave type, dates, duration, and reason before submitting it for approval.'
          : 'Update leave type, dates, duration, and reason before sending it back through workflow.'
      }
      error={error}
      onSubmit={() => void form.handleSubmit()}
      submitLabel={mode === 'draft' ? (isPending ? 'Saving...' : 'Save leave') : (isPending ? 'Resubmitting...' : 'Resubmit leave')}
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
