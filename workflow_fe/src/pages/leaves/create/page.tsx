import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'

import {
FormField,
FormInput,
FormSection,
FormSelect,
FormTextarea
} from '@/components/form'
import { useLeavesControllerCreate } from '@/lib/api/gen'
import {
CreatePanel
} from '@/pages/utils/page-components'
import {
fieldError,
leaveFormSchema,
toCreateLeavePayload
} from '@/pages/utils/form-validation'

export function LeaveCreatePage() {
  const navigate = useNavigate()
  const createLeave = useLeavesControllerCreate({ mutation: { onSuccess: async () => navigate({ to: '/leaves' }) } })
  const form = useForm({
    defaultValues: {
      leaveType: 'ANNUAL',
      leaveDays: '1',
      startDate: '',
      endDate: '',
      reason: '',
    },
    validators: {
      onSubmit: leaveFormSchema,
    },
    onSubmit: ({ value }) => {
      createLeave.mutate({ data: toCreateLeavePayload(value) })
    },
  })

  return (
    <div className="max-w-3xl">
      <CreatePanel
        title="New leave"
        kicker="Leave request"
        description="Capture leave type, dates, duration, and reason before sending through workflow."
        error={createLeave.error}
        onSubmit={() => void form.handleSubmit()}
        submitLabel={createLeave.isPending ? 'Saving...' : 'Save leave'}
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
    </div>
  )
}
