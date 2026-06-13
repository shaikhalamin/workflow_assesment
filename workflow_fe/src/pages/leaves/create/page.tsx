import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import {
FormField,
FormInput,
FormSection,
FormSelect,
FormTextarea
} from '@/components/form'
import type {
CreateLeaveDto
} from '@/lib/api/gen'
import { useLeavesControllerCreate } from '@/lib/api/gen'
import {
CreatePanel
} from '@/pages/utils/page-components'

export function LeaveCreatePage() {
  const navigate = useNavigate()
  const createLeave = useLeavesControllerCreate({ mutation: { onSuccess: async () => navigate({ to: '/leaves' }) } })
  const [form, setForm] = useState({ leaveType: 'ANNUAL', leaveDays: 1, startDate: '', endDate: '', reason: '' })
  const leavePayload: CreateLeaveDto = {
    leaveType: form.leaveType,
    leaveDays: form.leaveDays,
    startDate: form.startDate,
    endDate: form.endDate,
    reason: form.reason || undefined,
  }

  return (
    <div className="max-w-3xl">
      <CreatePanel
        title="New leave"
        kicker="Leave request"
        description="Capture leave type, dates, duration, and reason before sending through workflow."
        error={createLeave.error}
        onSubmit={() => createLeave.mutate({ data: leavePayload })}
        submitLabel={createLeave.isPending ? 'Saving...' : 'Save leave'}
      >
        <FormSection index="01" title="Leave type">
          <FormField label="Type">
            <FormSelect
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
            <FormField label="Start date">
              <FormInput
                type="date"
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              />
            </FormField>
            <FormField label="End date">
              <FormInput
                type="date"
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </FormField>
            <FormField label="Leave days">
              <FormInput
                type="number"
                value={form.leaveDays}
                onChange={(event) => setForm({ ...form, leaveDays: Number(event.target.value) })}
              />
            </FormField>
          </div>
        </FormSection>
        <FormSection index="03" title="Reason">
          <FormField label="Reason">
            <FormTextarea
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
            />
          </FormField>
        </FormSection>
      </CreatePanel>
    </div>
  )
}
