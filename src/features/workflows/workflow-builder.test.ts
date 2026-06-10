import { describe, expect, it } from 'vitest'

import {
  createDefaultWorkflowDraft,
  describeWorkflowAssignee,
  getConditionFieldExample,
  getWorkflowBuilderStepState,
  getWorkflowModule,
  toWorkflowWizardPayload,
  workflowBuilderSteps,
} from './workflow-builder-store'

describe('workflow builder payload', () => {
  it('defines named wizard steps with explicit progress state', () => {
    expect(workflowBuilderSteps.map((step) => step.name)).toEqual([
      'Setup',
      'Rules',
      'Approval chains by rule',
      'Outcomes',
      'Review',
    ])
    expect(workflowBuilderSteps[0]?.description).toContain(
      'Basics, event, and trigger',
    )

    expect(getWorkflowBuilderStepState(3, 1)).toBe('complete')
    expect(getWorkflowBuilderStepState(3, 3)).toBe('current')
    expect(getWorkflowBuilderStepState(3, 5)).toBe('upcoming')
  })

  it('describes workflow assignees in production-readable language', () => {
    expect(
      describeWorkflowAssignee({
        stepOrder: 1,
        stepName: 'Finance review',
        stepType: 'FINANCE_CHECK',
        assigneeType: 'ROLE',
        assigneeRoleSlug: 'finance-admin',
        isRequired: true,
        requiresComment: true,
        requiresAttachment: false,
        canReject: true,
        canReassign: false,
      }),
    ).toBe('Role: Finance Admin')

    expect(
      describeWorkflowAssignee(
        {
          stepOrder: 2,
          stepName: 'CFO approval',
          stepType: 'MANAGEMENT_APPROVAL',
          assigneeType: 'USER',
          assigneeUserId: 'user-1',
          isRequired: true,
          requiresComment: false,
          requiresAttachment: false,
          canReject: true,
          canReassign: false,
        },
        [{ id: 'user-1', name: 'Ayesha Rahman', email: 'ayesha@example.com' }],
      ),
    ).toBe('User: Ayesha Rahman <ayesha@example.com>')

    expect(
      describeWorkflowAssignee({
        stepOrder: 3,
        stepName: 'Budget owner approval',
        stepType: 'APPROVAL',
        assigneeType: 'CUSTOM_FIELD_USER',
        assigneeFieldPath: 'customFields.budgetOwnerId',
        isRequired: true,
        requiresComment: false,
        requiresAttachment: false,
        canReject: true,
        canReassign: false,
      }),
    ).toBe('User from event field: customFields.budgetOwnerId')

    expect(
      describeWorkflowAssignee({
        stepOrder: 4,
        stepName: 'Missing user approval',
        stepType: 'APPROVAL',
        assigneeType: 'USER',
        isRequired: true,
        requiresComment: false,
        requiresAttachment: false,
        canReject: true,
        canReassign: false,
      }),
    ).toBe('Needs assignment')
  })

  it('starts new workflows with only manager approval in the default path', () => {
    const draft = createDefaultWorkflowDraft()

    expect(draft.rules[0]?.steps).toEqual([
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
    ])
  })

  it('exposes backend-backed condition field examples for rule guidance', () => {
    expect(getWorkflowModule('expenses')?.fields.map((field) => field.key)).toEqual([
      'amount',
      'currency',
      'category',
      'vendor',
      'itemValue',
      'price',
      'quantity',
      'departmentId',
      'customFields.budgetOwnerId',
    ])
    expect(getWorkflowModule('leaves')?.eventName).toBe('leave.submitted')
    expect(getWorkflowModule('leaves')?.entityType).toBe('LeaveRequest')
    expect(getConditionFieldExample('amount')).toEqual({
      value: 5000,
      label: 'Example: amount greater than or equal to 5000',
    })
    expect(getConditionFieldExample('leaveDays')).toEqual({
      value: 2,
      label: 'Example: leaveDays greater than or equal to 2',
    })
    expect(getConditionFieldExample('customFields.budgetOwnerId')).toEqual({
      value: '71cb34da-1809-4c72-b132-2b9860be8936',
      label: 'Example: customFields.budgetOwnerId equals 71cb34da-1809-4c72-b132-2b9860be8936',
    })
  })

  it('maps an expense workflow draft to the backend wizard payload', () => {
    const draft = createDefaultWorkflowDraft()
    draft.template.name = 'Expense approval workflow'
    draft.template.moduleName = 'expenses'
    draft.template.eventName = 'expense.submitted'
    draft.template.entityType = 'Expense'
    draft.triggerMode = 'conditions'
    draft.triggerConditions.conditions = [
      { field: 'departmentId', operator: 'eq', value: 'sales' },
    ]
    draft.rules = [
      {
        name: 'High value expense',
        priority: 1,
        isFallback: false,
        isActive: true,
        conditionJson: {
          mode: 'all',
          conditions: [{ field: 'amount', operator: 'gte', value: 10000 }],
        },
        steps: [
          {
            stepOrder: 1,
            stepName: 'Finance review',
            stepType: 'FINANCE_CHECK',
            assigneeType: 'ROLE',
            assigneeRoleSlug: 'finance-admin',
            isRequired: true,
            requiresComment: true,
            requiresAttachment: false,
            canReject: true,
            canReassign: false,
            slaHours: 24,
          },
        ],
      },
    ]

    expect(toWorkflowWizardPayload(draft)).toEqual({
      template: {
        name: 'Expense approval workflow',
        description: '',
        moduleName: 'expenses',
        eventName: 'expense.submitted',
        entityType: 'Expense',
        status: 'DRAFT',
        priority: 1,
        effectiveFrom: undefined,
        effectiveTo: undefined,
        allowResubmission: true,
        triggerConditionJson: {
          mode: 'all',
          conditions: [{ field: 'departmentId', operator: 'eq', value: 'sales' }],
        },
      },
      rules: [
        {
          name: 'High value expense',
          priority: 1,
          isFallback: false,
          isActive: true,
          conditionJson: {
            mode: 'all',
            conditions: [{ field: 'amount', operator: 'gte', value: 10000 }],
          },
          steps: [
            {
              stepOrder: 1,
              stepName: 'Finance review',
              stepType: 'FINANCE_CHECK',
              assigneeType: 'ROLE',
              assigneeRoleSlug: 'finance-admin',
              assigneeUserId: undefined,
              assigneeFieldPath: undefined,
              isRequired: true,
              requiresComment: true,
              requiresAttachment: false,
              canReject: true,
              canReassign: false,
              slaHours: 24,
            },
          ],
        },
      ],
      approvedActionsJson: {
        createPaymentRequest: true,
        notifyRequester: true,
        setStatus: 'APPROVED',
      },
      rejectedActionsJson: {
        allowResubmission: true,
        requireReason: true,
        setStatus: 'REJECTED',
      },
    })
  })
})
