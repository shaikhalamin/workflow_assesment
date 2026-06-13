import { type InvoicePdfData } from '@/features/invoices/invoice-pdf'
import { formatRoleLabel } from '@/features/workflows/workflow-builder-store'
import type {
AuthUserDto,
BillingRequestResponseDto,
ExpenseResponseDto,
LeaveResponseDto,
RbacPermissionResponseDto,
UserResponseDto,
WorkflowActionResponseDto,
WorkflowApprovalRuleResponseDto,
WorkflowApprovalStepConfigResponseDto,
WorkflowInstanceResponseDto,
WorkflowRequestSummaryResponseDto,
WorkflowStepResponseDto,
} from '@/lib/api/gen'
import { formatDate,formatValue } from '@/lib/format'

export type Row = Record<string, unknown>

export type DetailConditionValue = string | number | boolean | Array<string | number>

export type DetailCondition = {
  field: string
  operator: string
  value?: DetailConditionValue
}

export type DetailConditionGroup = {
  mode: 'all' | 'any'
  conditions: DetailCondition[]
}

export type OutcomeActionValue = string | number | boolean

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function stringFromObjectField(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

export function optionalStringFromObjectField(value: unknown) {
  return typeof value === 'string' ? value : null
}

export function idFromObjectField(value: unknown) {
  if (typeof value === 'string') return value
  if (isRecord(value) && typeof value.id === 'string') return value.id
  return undefined
}

export function userIdentityFromObjectField(value: unknown) {
  if (
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.email === 'string'
  ) {
    return `${value.name} (${value.email})`
  }

  return undefined
}

export function workflowUserFromObjectField(value: unknown) {
  if (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string'
  ) {
    return {
      id: value.id,
      name: value.name,
      email: value.email,
      designation: typeof value.designation === 'string' ? value.designation : null,
    }
  }

  return undefined
}

export function isWorkflowRequestSummary(
  value: unknown,
): value is WorkflowRequestSummaryResponseDto {
  if (!isRecord(value)) return false

  const requester = value.requester
  const hasRequester =
    requester === null ||
    (isRecord(requester) &&
      typeof requester.id === 'string' &&
      typeof requester.name === 'string' &&
      typeof requester.email === 'string')

  return (
    typeof value.title === 'string' &&
    typeof value.type === 'string' &&
    typeof value.requesterId === 'string' &&
    hasRequester &&
    (typeof value.amount === 'number' || value.amount === null) &&
    (typeof value.currency === 'string' || value.currency === null) &&
    (typeof value.leaveDays === 'number' || value.leaveDays === null) &&
    typeof value.createdAt === 'string'
  )
}

export function requestSummaryFromRow(
  row: Row | WorkflowStepResponseDto,
): WorkflowRequestSummaryResponseDto | null {
  return isWorkflowRequestSummary(row.request) ? row.request : null
}

export function invoicePdfDataFromUnknown(value: unknown): InvoicePdfData | null {
  if (!isRecord(value)) return null

  const id = stringFromObjectField(value.id)
  const invoiceNumber = stringFromObjectField(value.invoiceNumber)
  const title = stringFromObjectField(value.title)
  const currency = stringFromObjectField(value.currency)
  const status = stringFromObjectField(value.status)
  const amount =
    typeof value.amount === 'string' || typeof value.amount === 'number'
      ? String(value.amount)
      : undefined

  if (!id || !invoiceNumber || !title || !amount || !currency || !status) {
    return null
  }

  return {
    id,
    invoiceNumber,
    title,
    amount,
    currency,
    status,
    billingRequestId: optionalStringFromObjectField(value.billingRequestId),
    customerName: optionalStringFromObjectField(value.customerName),
    customerEmail: optionalStringFromObjectField(value.customerEmail),
    customerAddress: optionalStringFromObjectField(value.customerAddress),
    dueDate: optionalStringFromObjectField(value.dueDate),
    issuedAt: optionalStringFromObjectField(value.issuedAt),
    paidAt: optionalStringFromObjectField(value.paidAt),
    description: optionalStringFromObjectField(value.description),
  }
}

export function requestAmountOrDaysLabel(
  request: WorkflowRequestSummaryResponseDto | null,
) {
  if (!request) return '-'
  if (request.amount !== null) {
    const formattedAmount = new Intl.NumberFormat('en', {
      maximumFractionDigits: 2,
    }).format(request.amount)
    return request.currency
      ? `${request.currency} ${formattedAmount}`
      : formattedAmount
  }
  if (request.leaveDays !== null) {
    return `${request.leaveDays} ${request.leaveDays === 1 ? 'day' : 'days'}`
  }
  return '-'
}

export function requesterLabel(request: WorkflowRequestSummaryResponseDto | null) {
  if (!request) return '-'
  return request.requester
    ? `${request.requester.name} (${request.requester.email})`
    : request.requesterId
}

export function conditionValueFromUnknown(
  value: unknown,
): DetailConditionValue | undefined {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (
    Array.isArray(value) &&
    value.every((item) => typeof item === 'string' || typeof item === 'number')
  ) {
    return value
  }

  return undefined
}

export function conditionGroupFromUnknown(
  value: unknown,
): DetailConditionGroup | undefined {
  if (!isRecord(value)) return undefined
  const mode = value.mode === 'any' ? 'any' : 'all'
  if (!Array.isArray(value.conditions)) return undefined

  const conditions = value.conditions
    .map((item): DetailCondition | undefined => {
      if (
        !isRecord(item) ||
        typeof item.field !== 'string' ||
        typeof item.operator !== 'string'
      ) {
        return undefined
      }

      return {
        field: item.field,
        operator: item.operator,
        value: conditionValueFromUnknown(item.value),
      }
    })
    .filter((item): item is DetailCondition => Boolean(item))

  return { mode, conditions }
}

export function outcomeActionsFromUnknown(
  value: unknown,
): Record<string, OutcomeActionValue> {
  if (!isRecord(value)) return {}

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, OutcomeActionValue] => {
      const [, item] = entry
      return (
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean'
      )
    }),
  )
}

export const conditionOperatorLabels: Record<string, string> = {
  eq: 'equals',
  neq: 'does not equal',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  between: 'between',
  in: 'is one of',
  not_in: 'is not one of',
  contains: 'contains',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
}

export const stepTypeLabels: Record<string, string> = {
  REVIEW: 'Review',
  APPROVAL: 'Approval',
  FINANCE_CHECK: 'Finance Check',
  HR_CHECK: 'HR Check',
  MANAGEMENT_APPROVAL: 'Management Approval',
  FINAL_VERIFICATION: 'Final Verification',
}

export type ReadableRow = {
  label: string
  value: React.ReactNode
}

export type RuntimeStepStatus = WorkflowStepResponseDto['status']

export type WorkflowUserReference = {
  id: string
  name: string
  email: string
  designation?: string | null
}

export type WorkflowStepWithUsers = WorkflowStepResponseDto & {
  actionByUser?: WorkflowUserReference | null
  assignedUser?: WorkflowUserReference | null
}

export type WorkflowActionWithUser = WorkflowActionResponseDto & {
  actorUser?: WorkflowUserReference | null
}

export const runtimeStepStatusText: Record<RuntimeStepStatus, string> = {
  APPROVED: 'Completed successfully',
  REJECTED: 'Stopped at this step',
  ACTIVE: 'Currently waiting for action',
  WAITING: 'Upcoming step',
  SKIPPED: 'Skipped',
}

export function primitiveFromObjectField(value: unknown) {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  return undefined
}

export function readableValue(value: unknown) {
  const primitive = primitiveFromObjectField(value)
  if (primitive !== undefined) return formatValue(primitive)
  return undefined
}

export function dateFromObjectField(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

export function readableRowsFromRecord(value: unknown): ReadableRow[] {
  if (!isRecord(value)) return []

  return Object.entries(value)
    .map((entry): ReadableRow | undefined => {
      const [key, item] = entry
      const formatted = readableValue(item)
      return formatted
        ? {
            label: humanizeKey(key),
            value: formatted,
          }
        : undefined
    })
    .filter((row): row is ReadableRow => Boolean(row))
}

export function workflowIdFromExpense(expense: ExpenseResponseDto) {
  const workflowId = stringFromObjectField(expense.workflowInstanceId)
  return workflowId ?? undefined
}

export function workflowIdFromLeave(leave: LeaveResponseDto) {
  const workflowId = stringFromObjectField(leave.workflowInstanceId)
  return workflowId ?? undefined
}

export function workflowIdFromBilling(billing: BillingRequestResponseDto) {
  const workflowId = stringFromObjectField(billing.workflowInstanceId)
  return workflowId ?? undefined
}

export function moneyLabel(amount: unknown, currency: unknown) {
  return `${formatValue(amount)} ${formatValue(currency)}`
}

export function formatOptionalDate(value: unknown) {
  return formatDate(dateFromObjectField(value))
}

export function findUserById(users: UserResponseDto[], userId: string | undefined) {
  if (!userId) return undefined
  return users.find((user) => user.id === userId)
}

export function formatUserIdentity(user: Pick<UserResponseDto, 'name' | 'email'>) {
  return `${user.name} (${user.email})`
}

export function describeUserReference(
  users: UserResponseDto[],
  userReference: unknown,
  currentUser?: AuthUserDto | null,
) {
  const embeddedUser = userIdentityFromObjectField(userReference)
  if (embeddedUser) return embeddedUser

  const userId = idFromObjectField(userReference)
  if (!userId) return undefined
  if (currentUser?.id === userId) return formatUserIdentity(currentUser)
  const user = findUserById(users, userId)
  if (!user) return `User ID: ${userId}`
  return formatUserIdentity(user)
}

export function describeRuntimeAssignee(
  step: WorkflowStepResponseDto,
  users: UserResponseDto[],
  requesterId: string,
  currentUser?: AuthUserDto | null,
) {
  const stepWithUsers = step as WorkflowStepWithUsers
  const assignedUserReference = stepWithUsers.assignedUser ?? step.assignedUserId

  if (step.assigneeType === 'ROLE') {
    const role = step.assignedRoleSlug
    if (!role) return 'Role assignment pending'

    const assignedUser = describeUserReference(
      users,
      assignedUserReference,
      currentUser,
    )
    if (assignedUser) return `Role: ${formatRoleLabel(role)}, ${assignedUser}`

    return currentUser?.roles.includes(role)
      ? `Role: ${formatRoleLabel(role)}, ${formatUserIdentity(currentUser)}`
      : `Role: ${formatRoleLabel(role)}`
  }

  if (step.assigneeType === 'USER') {
    const userReference = describeUserReference(users, assignedUserReference, currentUser)
    return userReference ? `User: ${userReference}` : 'User assignment pending'
  }

  if (step.assigneeType === 'REQUESTER_MANAGER') {
    const assignedUser = describeUserReference(
      users,
      assignedUserReference,
      currentUser,
    )
    if (assignedUser) return `Requester manager: ${assignedUser}`

    const assignedUserId = idFromObjectField(assignedUserReference)
    const requester = findUserById(users, requesterId)
    const managerId =
      assignedUserId ?? stringFromObjectField(requester?.managerId)
    const managerReference = describeUserReference(users, managerId, currentUser)
    if (managerReference) return `Requester manager: ${managerReference}`

    const requesterReference = describeUserReference(users, requesterId, currentUser)
    return requesterReference
      ? `Requester manager for ${requesterReference} is not resolved`
      : "Requester's manager is not resolved"
  }

  if (step.assigneeType === 'DEPARTMENT_HEAD') {
    const userReference = describeUserReference(users, assignedUserReference, currentUser)
    return userReference
      ? `Department head: ${userReference}`
      : 'Department head is not resolved'
  }

  const userReference = describeUserReference(users, assignedUserReference, currentUser)
  return userReference
    ? `Custom field user: ${userReference}`
    : 'User from custom field is not resolved'
}

export function timelineUserFromStep(
  step: WorkflowStepResponseDto,
  users: UserResponseDto[],
  currentUser?: AuthUserDto | null,
) {
  const stepWithUsers = step as WorkflowStepWithUsers
  const assignedReference = stepWithUsers.assignedUser ?? step.assignedUserId
  const embeddedUser = workflowUserFromObjectField(assignedReference)
  if (embeddedUser) return embeddedUser

  const assignedUserId = idFromObjectField(assignedReference)
  if (!assignedUserId) return undefined
  if (currentUser?.id === assignedUserId) {
    return {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      designation: null,
    }
  }

  const user = findUserById(users, assignedUserId)
  return user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        designation: user.designation,
      }
    : undefined
}

export function timelineStepHeader(
  step: WorkflowStepResponseDto,
  users: UserResponseDto[],
  requesterId: string,
  currentUser?: AuthUserDto | null,
) {
  const user = timelineUserFromStep(step, users, currentUser)
  const assignee = describeRuntimeAssignee(step, users, requesterId, currentUser)

  if (user) {
    return {
      title: user.name,
      subtitle: user.designation ?? assignee,
    }
  }

  if (step.assigneeType === 'ROLE' && step.assignedRoleSlug) {
    return {
      title: formatRoleLabel(step.assignedRoleSlug),
      subtitle: 'Role assignee',
    }
  }

  if (step.assigneeType === 'REQUESTER_MANAGER') {
    return {
      title: 'Requester manager',
      subtitle: assignee,
    }
  }

  if (step.assigneeType === 'DEPARTMENT_HEAD') {
    return {
      title: 'Department head',
      subtitle: assignee,
    }
  }

  if (step.assigneeType === 'CUSTOM_FIELD_USER') {
    return {
      title: 'Custom field user',
      subtitle: assignee,
    }
  }

  return {
    title: step.stepName || 'Unnamed step',
    subtitle: stepTypeLabels[step.stepType] ?? step.stepType,
  }
}

export function canActOnStep(
  step: WorkflowStepResponseDto | undefined,
  userRoles: string[],
  userId?: string,
) {
  if (!step || step.status !== 'ACTIVE' || !userId) return false

  if (step.assigneeType === 'USER') {
    const stepWithUsers = step as WorkflowStepWithUsers
    return idFromObjectField(stepWithUsers.assignedUser ?? step.assignedUserId) === userId
  }

  if (step.assigneeType === 'ROLE') {
    const role = step.assignedRoleSlug
    return Boolean(role && userRoles.includes(role))
  }

  const stepWithUsers = step as WorkflowStepWithUsers
  return idFromObjectField(stepWithUsers.assignedUser ?? step.assignedUserId) === userId
}

export function getSortedRuntimeSteps(instance: WorkflowInstanceResponseDto) {
  const steps = Array.isArray(instance.steps) ? instance.steps : []
  return [...steps].sort(
    (first, second) => first.stepOrder - second.stepOrder,
  )
}

export function humanizeKey(value: string) {
  const label = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .toLowerCase()

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatConditionValue(value: DetailConditionValue | undefined) {
  if (Array.isArray(value)) return value.join(', ')
  return formatValue(value)
}

export function describeCondition(condition: DetailCondition) {
  const operator =
    conditionOperatorLabels[condition.operator] ?? condition.operator
  if (
    condition.operator === 'is_empty' ||
    condition.operator === 'is_not_empty'
  ) {
    return `${condition.field} ${operator}`
  }

  return `${condition.field} ${operator} ${formatConditionValue(condition.value)}`
}

export function describeConditionGroup(group: DetailConditionGroup | undefined) {
  if (!group || group.conditions.length === 0) return 'No conditions configured.'
  const prefix =
    group.mode === 'any' ? 'Any condition can match' : 'All conditions must match'
  return `${prefix}: ${group.conditions.map(describeCondition).join(', ')}`
}

export function describeStepAssignee(step: WorkflowApprovalStepConfigResponseDto) {
  if (step.assigneeType === 'ROLE') {
    const role = step.assigneeRoleSlug
    return role ? `Role: ${formatRoleLabel(role)}` : 'Needs assignment'
  }

  if (step.assigneeType === 'USER') {
    const userId = step.assigneeUserId
    return userId ? `User ID: ${userId}` : 'Needs assignment'
  }

  if (step.assigneeType === 'REQUESTER_MANAGER') {
    return "Requester's manager"
  }

  if (step.assigneeType === 'DEPARTMENT_HEAD') {
    return 'Department head'
  }

  const fieldPath = step.assigneeFieldPath
  return fieldPath ? `User from event field: ${fieldPath}` : 'Needs assignment'
}

export function stepFlags(step: WorkflowApprovalStepConfigResponseDto) {
  return [
    step.isRequired ? 'Required' : undefined,
    step.canReject ? 'Can reject' : undefined,
    step.requiresComment ? 'Comment required' : undefined,
    step.canReassign ? 'Reassign allowed' : undefined,
  ].filter((item): item is string => Boolean(item))
}

export function ruleConditionText(rule: WorkflowApprovalRuleResponseDto) {
  if (rule.isFallback) return 'Fallback path when no earlier rule matches.'
  const group = conditionGroupFromUnknown(rule.conditionJson)
  return describeConditionGroup(group)
}

export function outcomeRows(actions: Record<string, OutcomeActionValue>) {
  const handledKeys = new Set([
    'setStatus',
    'notifyRequester',
    'createPaymentRequest',
    'requireReason',
    'requiresRejectionReason',
    'allowResubmission',
  ])

  return Object.entries(actions)
    .filter(([key]) => !handledKeys.has(key))
    .map(([key, value]) => ({
      label: humanizeKey(key),
      value: formatValue(value),
    }))
}

export function sameSlugSet(left: readonly string[], right: readonly string[]) {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((slug) => rightSet.has(slug))
}

export function groupedPermissions(permissions: RbacPermissionResponseDto[]) {
  return permissions.reduce<Record<string, RbacPermissionResponseDto[]>>(
    (groups, permission) => {
      groups[permission.resource] = [...(groups[permission.resource] ?? []), permission]
      return groups
    },
    {},
  )
}

export function dateInputValue(value: Date) {
  return value.toISOString().slice(0, 10)
}

export const expenseCategoryOptions = ['Travel', 'Meal', 'Office Supplies', 'Software']
export const expenseVendorOptions = ['Star Tech', 'Pathao', 'Daraz', 'Ryans Computers', 'Foodpanda']

export const billingCategoryOptions = ['Installation', 'Service', 'Subscription', 'Hardware']
