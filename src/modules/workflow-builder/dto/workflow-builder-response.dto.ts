import { ApiProperty } from '@nestjs/swagger';
import {
  WorkflowAssigneeType,
  WorkflowStepType,
  WorkflowTemplateStatus,
} from '../enums/workflow-builder.enums';

export class WorkflowTriggerConditionResponseDto {
  @ApiProperty({ example: 'cfc26df2-d379-4fbb-9c61-b901d72f1651' })
  id!: string;

  @ApiProperty({ example: '24fa2355-a172-4910-9314-032b967f54ba' })
  workflowTemplateId!: string;

  @ApiProperty({
    example: {
      mode: 'all',
      conditions: [{ field: 'amount', operator: 'gte', value: 50000 }],
    },
  })
  conditionJson!: Record<string, unknown>;

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  updatedAt!: string;
}

export class WorkflowOutcomeConfigResponseDto {
  @ApiProperty({ example: '04cfaf1e-ea6e-4a43-a167-64627091327a' })
  id!: string;

  @ApiProperty({ example: '24fa2355-a172-4910-9314-032b967f54ba' })
  workflowTemplateId!: string;

  @ApiProperty({
    example: { setStatus: 'APPROVED', createPaymentRequest: true },
    nullable: true,
  })
  approvedActionsJson!: Record<string, unknown> | null;

  @ApiProperty({ example: { setStatus: 'REJECTED' }, nullable: true })
  rejectedActionsJson!: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  updatedAt!: string;
}

export class WorkflowApprovalStepConfigResponseDto {
  @ApiProperty({ example: '91332a94-53d5-41e3-a69d-b767e8881658' })
  id!: string;

  @ApiProperty({ example: '43de63c7-c1e9-4527-aa1b-31d2d9030c93' })
  workflowApprovalRuleId!: string;

  @ApiProperty({ example: 1 })
  stepOrder!: number;

  @ApiProperty({ example: 'Finance review' })
  stepName!: string;

  @ApiProperty({
    enum: WorkflowStepType,
    example: WorkflowStepType.FINANCE_CHECK,
  })
  stepType!: WorkflowStepType;

  @ApiProperty({
    enum: WorkflowAssigneeType,
    example: WorkflowAssigneeType.ROLE,
  })
  assigneeType!: WorkflowAssigneeType;

  @ApiProperty({ type: String, example: 'accounts', nullable: true })
  assigneeRoleSlug!: string | null;

  @ApiProperty({
    type: String,
    example: '71cb34da-1809-4c72-b132-2b9860be8936',
    nullable: true,
  })
  assigneeUserId!: string | null;

  @ApiProperty({
    type: String,
    example: 'customFields.budgetOwnerId',
    nullable: true,
  })
  assigneeFieldPath!: string | null;

  @ApiProperty({ example: true })
  isRequired!: boolean;

  @ApiProperty({ example: false })
  requiresComment!: boolean;

  @ApiProperty({ example: false })
  requiresAttachment!: boolean;

  @ApiProperty({ example: true })
  canReject!: boolean;

  @ApiProperty({ example: false })
  canReassign!: boolean;

  @ApiProperty({ type: Number, example: 24, nullable: true })
  slaHours!: number | null;

  @ApiProperty({
    enum: WorkflowAssigneeType,
    example: WorkflowAssigneeType.DEPARTMENT_HEAD,
    nullable: true,
  })
  escalationAssigneeType!: WorkflowAssigneeType | null;

  @ApiProperty({ type: String, example: 'department-head', nullable: true })
  escalationAssigneeRoleSlug!: string | null;

  @ApiProperty({
    type: String,
    example: '71cb34da-1809-4c72-b132-2b9860be8936',
    nullable: true,
  })
  escalationAssigneeUserId!: string | null;

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  updatedAt!: string;
}

export class WorkflowApprovalRuleResponseDto {
  @ApiProperty({ example: '43de63c7-c1e9-4527-aa1b-31d2d9030c93' })
  id!: string;

  @ApiProperty({ example: '24fa2355-a172-4910-9314-032b967f54ba' })
  workflowTemplateId!: string;

  @ApiProperty({ example: 'High value expense' })
  name!: string;

  @ApiProperty({ example: 10 })
  priority!: number;

  @ApiProperty({
    example: {
      mode: 'all',
      conditions: [{ field: 'amount', operator: 'gte', value: 50000 }],
    },
    nullable: true,
  })
  conditionJson!: Record<string, unknown> | null;

  @ApiProperty({ example: false })
  isFallback!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: [WorkflowApprovalStepConfigResponseDto] })
  steps!: WorkflowApprovalStepConfigResponseDto[];

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  updatedAt!: string;
}

export class WorkflowTemplateResponseDto {
  @ApiProperty({ example: '24fa2355-a172-4910-9314-032b967f54ba' })
  id!: string;

  @ApiProperty({ example: 'Expense approval workflow' })
  name!: string;

  @ApiProperty({
    type: String,
    example: 'Routes expenses through finance approval',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 'expenses' })
  moduleName!: string;

  @ApiProperty({ example: 'expense.submitted' })
  eventName!: string;

  @ApiProperty({ example: 'Expense' })
  entityType!: string;

  @ApiProperty({
    enum: WorkflowTemplateStatus,
    example: WorkflowTemplateStatus.DRAFT,
  })
  status!: WorkflowTemplateStatus;

  @ApiProperty({ example: 10 })
  priority!: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-10T00:00:00.000Z',
    nullable: true,
  })
  effectiveFrom!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-12-31T23:59:59.000Z',
    nullable: true,
  })
  effectiveTo!: string | null;

  @ApiProperty({ example: true })
  allowResubmission!: boolean;

  @ApiProperty({
    type: String,
    example: '71cb34da-1809-4c72-b132-2b9860be8936',
    nullable: true,
  })
  createdById!: string | null;

  @ApiProperty({ type: WorkflowTriggerConditionResponseDto, nullable: true })
  triggerCondition!: WorkflowTriggerConditionResponseDto | null;

  @ApiProperty({ type: [WorkflowApprovalRuleResponseDto] })
  rules!: WorkflowApprovalRuleResponseDto[];

  @ApiProperty({ type: WorkflowOutcomeConfigResponseDto, nullable: true })
  outcomeConfig!: WorkflowOutcomeConfigResponseDto | null;

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  updatedAt!: string;
}

export class WorkflowEventSchemaResponseDto {
  @ApiProperty({ example: '9abd2fcf-3f38-4ff3-9c4d-f857350d43c5' })
  id!: string;

  @ApiProperty({ example: 'expenses' })
  moduleName!: string;

  @ApiProperty({ example: 'expense.submitted' })
  eventName!: string;

  @ApiProperty({ example: 'Expense' })
  entityType!: string;

  @ApiProperty({
    example: {
      fields: [
        {
          key: 'amount',
          type: 'number',
          operators: ['gt', 'gte', 'lt', 'lte'],
        },
      ],
    },
  })
  fieldSchemaJson!: Record<string, unknown>;

  @ApiProperty({
    example: { approved: [{ type: 'set_status', value: 'APPROVED' }] },
    nullable: true,
  })
  outcomeActionsJson!: Record<string, unknown> | null;

  @ApiProperty({
    example: { departmentHead: { type: 'DEPARTMENT_HEAD' } },
    nullable: true,
  })
  assigneeResolversJson!: Record<string, unknown> | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  updatedAt!: string;
}
