import { create } from 'zustand'

import type { WorkflowTemplateControllerCreateWizardMutationRequest } from '@/lib/api/gen'

export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'is_empty'
  | 'is_not_empty'

export type Condition = {
  field: string
  operator: ConditionOperator
  value?: string | number | boolean | Array<string | number>
}

export type ConditionGroup = {
  mode: 'all' | 'any'
  conditions: Condition[]
}

export type WorkflowConditionField = {
  key: string
  type: 'number' | 'string' | 'user'
  sampleValue: string | number
}

export type WorkflowModuleOption = {
  label: string
  moduleName: string
  eventName: string
  entityType: string
  description: string
  fields: WorkflowConditionField[]
}

export type WorkflowStepDraft = {
  stepOrder: number
  stepName: string
  stepType:
    | 'REVIEW'
    | 'APPROVAL'
    | 'FINANCE_CHECK'
    | 'HR_CHECK'
    | 'MANAGEMENT_APPROVAL'
    | 'FINAL_VERIFICATION'
  assigneeType:
    | 'ROLE'
    | 'USER'
    | 'REQUESTER_MANAGER'
    | 'DEPARTMENT_HEAD'
    | 'CUSTOM_FIELD_USER'
  assigneeRoleSlug?: string
  assigneeUserId?: string
  assigneeFieldPath?: string
  isRequired: boolean
  requiresComment: boolean
  requiresAttachment: boolean
  canReject: boolean
  canReassign: boolean
  slaHours?: number
}

export type WorkflowRuleDraft = {
  name: string
  priority: number
  conditionJson?: ConditionGroup
  isFallback: boolean
  isActive: boolean
  steps: WorkflowStepDraft[]
}

export type WorkflowDraft = {
  template: {
    name: string
    description: string
    moduleName: string
    eventName: string
    entityType: string
    status: 'DRAFT' | 'PUBLISHED'
    priority: number
    effectiveFrom?: string
    effectiveTo?: string
    allowResubmission: boolean
  }
  triggerMode: 'always' | 'conditions'
  triggerConditions: ConditionGroup
  rules: WorkflowRuleDraft[]
  approvedActionsJson: Record<string, unknown>
  rejectedActionsJson: Record<string, unknown>
}

type WorkflowBuilderStore = {
  step: number
  draft: WorkflowDraft
  setStep: (step: number) => void
  patchDraft: (patch: Partial<WorkflowDraft>) => void
  setDraft: (draft: WorkflowDraft) => void
  reset: () => void
}

export const workflowModules: WorkflowModuleOption[] = [
  {
    label: 'Expense',
    moduleName: 'expenses',
    eventName: 'expense.submitted',
    entityType: 'Expense',
    description: 'Triggered when an employee submits an expense request.',
    fields: [
      { key: 'amount', type: 'number', sampleValue: 5000 },
      { key: 'currency', type: 'string', sampleValue: 'BDT' },
      { key: 'category', type: 'string', sampleValue: 'travel' },
      { key: 'vendor', type: 'string', sampleValue: 'ACME' },
      { key: 'itemValue', type: 'number', sampleValue: 7500 },
      { key: 'price', type: 'number', sampleValue: 7500 },
      { key: 'quantity', type: 'number', sampleValue: 1 },
      { key: 'departmentId', type: 'string', sampleValue: 'sales' },
      {
        key: 'customFields.budgetOwnerId',
        type: 'user',
        sampleValue: '71cb34da-1809-4c72-b132-2b9860be8936',
      },
    ],
  },
  {
    label: 'Leave',
    moduleName: 'leaves',
    eventName: 'leave.submitted',
    entityType: 'LeaveRequest',
    description: 'Triggered when an employee submits a leave request.',
    fields: [
      { key: 'leaveType', type: 'string', sampleValue: 'ANNUAL' },
      { key: 'leaveDays', type: 'number', sampleValue: 2 },
      { key: 'startDate', type: 'string', sampleValue: '2026-06-10' },
      { key: 'endDate', type: 'string', sampleValue: '2026-06-11' },
      { key: 'employeeGrade', type: 'string', sampleValue: 'G5' },
      { key: 'departmentId', type: 'string', sampleValue: 'sales' },
    ],
  },
  {
    label: 'Attendance',
    moduleName: 'attendance',
    eventName: 'attendance.adjustment_submitted',
    entityType: 'AttendanceAdjustment',
    description: 'Future event for attendance adjustment workflows.',
    fields: [
      { key: 'adjustmentType', type: 'string', sampleValue: 'LATE_CHECK_IN' },
      { key: 'employeeGrade', type: 'string', sampleValue: 'G5' },
      { key: 'departmentId', type: 'string', sampleValue: 'sales' },
    ],
  },
]

export function getWorkflowModule(moduleName: string) {
  return workflowModules.find((item) => item.moduleName === moduleName)
}

export function getConditionFieldExample(fieldKey: string) {
  const field = workflowModules
    .flatMap((module) => module.fields)
    .find((item) => item.key === fieldKey)
  const value = field?.sampleValue ?? ''
  const operator = field?.type === 'number' ? 'gte' : 'eq'
  const operatorText = operator === 'gte' ? 'greater than or equal to' : 'equals'

  return {
    value,
    label: value
      ? `Example: ${fieldKey} ${operatorText} ${value}`
      : `Example: choose a value for ${fieldKey}`,
  }
}

export function getDefaultConditionOperator(fieldKey: string): ConditionOperator {
  const field = workflowModules
    .flatMap((module) => module.fields)
    .find((item) => item.key === fieldKey)

  return field?.type === 'number' ? 'gte' : 'eq'
}

export function parseConditionValue(value: string, fieldKey: string) {
  const field = workflowModules
    .flatMap((module) => module.fields)
    .find((item) => item.key === fieldKey)

  if (field?.type !== 'number') return value
  const parsed = Number(value)
  return Number.isNaN(parsed) ? value : parsed
}

export const roleOptions = [
  'department-reviewer',
  'manager',
  'accounts',
  'accounts-officer',
  'hr-officer',
  'finance-admin',
  'cfo',
  'management',
]

export function createDefaultWorkflowDraft(): WorkflowDraft {
  return {
    template: {
      name: '',
      description: '',
      moduleName: 'expenses',
      eventName: 'expense.submitted',
      entityType: 'Expense',
      status: 'DRAFT',
      priority: 1,
      effectiveFrom: undefined,
      effectiveTo: undefined,
      allowResubmission: true,
    },
    triggerMode: 'always',
    triggerConditions: {
      mode: 'all',
      conditions: [],
    },
    rules: [
      {
        name: 'Default approval path',
        priority: 1,
        isFallback: true,
        isActive: true,
        conditionJson: undefined,
        steps: [
          {
            stepOrder: 1,
            stepName: 'Manager approval',
            stepType: 'APPROVAL',
            assigneeType: 'REQUESTER_MANAGER',
            isRequired: true,
            requiresComment: false,
            requiresAttachment: false,
            canReject: true,
            canReassign: false,
            slaHours: 24,
          },
          {
            stepOrder: 2,
            stepName: 'Accounts review',
            stepType: 'FINAL_VERIFICATION',
            assigneeType: 'ROLE',
            assigneeRoleSlug: 'accounts',
            isRequired: true,
            requiresComment: true,
            requiresAttachment: false,
            canReject: true,
            canReassign: false,
            slaHours: 48,
          },
        ],
      },
    ],
    approvedActionsJson: {
      setStatus: 'APPROVED',
      createPaymentRequest: true,
      notifyRequester: true,
    },
    rejectedActionsJson: {
      setStatus: 'REJECTED',
      requireReason: true,
      allowResubmission: true,
    },
  }
}

export function toWorkflowWizardPayload(
  draft: WorkflowDraft,
): WorkflowTemplateControllerCreateWizardMutationRequest {
  return ({
    template: {
      ...draft.template,
      effectiveFrom: draft.template.effectiveFrom || undefined,
      effectiveTo: draft.template.effectiveTo || undefined,
      triggerConditionJson:
        draft.triggerMode === 'conditions'
          ? draft.triggerConditions
          : { mode: 'all', conditions: [] },
    },
    rules: draft.rules.map((rule) => ({
      name: rule.name,
      priority: rule.priority,
      conditionJson: rule.isFallback ? undefined : rule.conditionJson,
      isFallback: rule.isFallback,
      isActive: rule.isActive,
      steps: rule.steps.map((step, index) => ({
        stepOrder: index + 1,
        stepName: step.stepName,
        stepType: step.stepType,
        assigneeType: step.assigneeType,
        assigneeRoleSlug: step.assigneeRoleSlug,
        assigneeUserId: step.assigneeUserId,
        assigneeFieldPath: step.assigneeFieldPath,
        isRequired: step.isRequired,
        requiresComment: step.requiresComment,
        requiresAttachment: step.requiresAttachment,
        canReject: step.canReject,
        canReassign: step.canReassign,
        slaHours: step.slaHours,
      })),
    })),
    approvedActionsJson: draft.approvedActionsJson,
    rejectedActionsJson: draft.rejectedActionsJson,
  } as unknown) as WorkflowTemplateControllerCreateWizardMutationRequest
}

export const useWorkflowBuilderStore = create<WorkflowBuilderStore>((set) => ({
  step: 1,
  draft: createDefaultWorkflowDraft(),
  setStep: (step) => set({ step }),
  patchDraft: (patch) =>
    set((state) => ({ draft: { ...state.draft, ...patch } })),
  setDraft: (draft) => set({ draft }),
  reset: () => set({ step: 1, draft: createDefaultWorkflowDraft() }),
}))
