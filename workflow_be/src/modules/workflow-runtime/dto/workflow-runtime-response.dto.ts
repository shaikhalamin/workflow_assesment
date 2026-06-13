import { ApiProperty } from '@nestjs/swagger';
import {
  WorkflowAssigneeType,
  WorkflowStepType,
} from '../../workflow-builder/enums/workflow-builder.enums';
import {
  WorkflowActionType,
  WorkflowInstanceStatus,
  WorkflowStepStatus,
} from '../enums/workflow-runtime.enums';

export class WorkflowUserResponseDto {
  @ApiProperty({ example: '71cb34da-1809-4c72-b132-2b9860be8936' })
  id!: string;

  @ApiProperty({ example: 'Finance Approver' })
  name!: string;

  @ApiProperty({ example: 'finance@example.com' })
  email!: string;

  @ApiProperty({ type: String, example: 'Finance Approver', nullable: true })
  designation!: string | null;
}

export class WorkflowActionResponseDto {
  @ApiProperty({ example: '512f52a0-08df-4ba7-b108-4e46f06a057b' })
  id!: string;

  @ApiProperty({ example: '9f527490-d2a2-44aa-994c-ffb91adf9df2' })
  workflowInstanceId!: string;

  @ApiProperty({
    type: String,
    example: 'e7c883f6-90e7-465e-8abc-4c7f8e5e7d4a',
    nullable: true,
  })
  workflowStepId!: string | null;

  @ApiProperty({
    enum: WorkflowActionType,
    example: WorkflowActionType.APPROVED,
  })
  action!: WorkflowActionType;

  @ApiProperty({
    type: String,
    example: '71cb34da-1809-4c72-b132-2b9860be8936',
    nullable: true,
  })
  actorUserId!: string | null;

  @ApiProperty({ type: WorkflowUserResponseDto, nullable: true })
  actorUser!: WorkflowUserResponseDto | null;

  @ApiProperty({
    type: String,
    example: 'Approved after checking documents',
    nullable: true,
  })
  comment!: string | null;

  @ApiProperty({ type: String, example: 'Budget verified', nullable: true })
  reason!: string | null;

  @ApiProperty({ example: { reviewedBy: 'finance-admin' }, nullable: true })
  metadataJson!: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  createdAt!: string;
}

export class WorkflowRequestSummaryResponseDto {
  @ApiProperty({ example: 'Laptop charger reimbursement' })
  title!: string;

  @ApiProperty({ example: 'Expense' })
  type!: string;

  @ApiProperty({ example: '71cb34da-1809-4c72-b132-2b9860be8936' })
  requesterId!: string;

  @ApiProperty({ type: WorkflowUserResponseDto, nullable: true })
  requester!: WorkflowUserResponseDto | null;

  @ApiProperty({ type: Number, example: 4500, nullable: true })
  amount!: number | null;

  @ApiProperty({ type: String, example: 'BDT', nullable: true })
  currency!: string | null;

  @ApiProperty({ type: Number, example: 2, nullable: true })
  leaveDays!: number | null;

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;
}

export class WorkflowStepResponseDto {
  @ApiProperty({ example: 'e7c883f6-90e7-465e-8abc-4c7f8e5e7d4a' })
  id!: string;

  @ApiProperty({ example: '9f527490-d2a2-44aa-994c-ffb91adf9df2' })
  workflowInstanceId!: string;

  @ApiProperty({ type: WorkflowRequestSummaryResponseDto, nullable: true })
  request!: WorkflowRequestSummaryResponseDto | null;

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
    type: String,
    example: '71cb34da-1809-4c72-b132-2b9860be8936',
    nullable: true,
  })
  assignedUserId!: string | null;

  @ApiProperty({ type: WorkflowUserResponseDto, nullable: true })
  assignedUser!: WorkflowUserResponseDto | null;

  @ApiProperty({ type: String, example: 'accounts', nullable: true })
  assignedRoleSlug!: string | null;

  @ApiProperty({
    enum: WorkflowAssigneeType,
    example: WorkflowAssigneeType.ROLE,
  })
  assigneeType!: WorkflowAssigneeType;

  @ApiProperty({ enum: WorkflowStepStatus, example: WorkflowStepStatus.ACTIVE })
  status!: WorkflowStepStatus;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-10T10:15:00.000Z',
    nullable: true,
  })
  activatedAt!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-10T12:15:00.000Z',
    nullable: true,
  })
  actedAt!: string | null;

  @ApiProperty({
    type: String,
    example: '71cb34da-1809-4c72-b132-2b9860be8936',
    nullable: true,
  })
  actionByUserId!: string | null;

  @ApiProperty({ type: WorkflowUserResponseDto, nullable: true })
  actionByUser!: WorkflowUserResponseDto | null;

  @ApiProperty({
    type: String,
    example: 'Approved after checking documents',
    nullable: true,
  })
  comment!: string | null;

  @ApiProperty({ type: String, example: 'Receipt missing', nullable: true })
  rejectionReason!: string | null;

  @ApiProperty({ type: [WorkflowActionResponseDto] })
  actions!: WorkflowActionResponseDto[];

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  updatedAt!: string;
}

export class WorkflowInstanceResponseDto {
  @ApiProperty({ example: '9f527490-d2a2-44aa-994c-ffb91adf9df2' })
  id!: string;

  @ApiProperty({ example: '24fa2355-a172-4910-9314-032b967f54ba' })
  workflowTemplateId!: string;

  @ApiProperty({ example: '43de63c7-c1e9-4527-aa1b-31d2d9030c93' })
  workflowApprovalRuleId!: string;

  @ApiProperty({ example: 'expenses' })
  moduleName!: string;

  @ApiProperty({ example: 'expense.submitted' })
  eventName!: string;

  @ApiProperty({ example: 'Expense' })
  entityType!: string;

  @ApiProperty({ example: 'expense-2026-0001' })
  entityId!: string;

  @ApiProperty({ example: '71cb34da-1809-4c72-b132-2b9860be8936' })
  requesterId!: string;

  @ApiProperty({ type: WorkflowUserResponseDto, nullable: true })
  requester!: WorkflowUserResponseDto | null;

  @ApiProperty({
    type: String,
    example: '61f1d2de-5733-4830-a97c-cb1899482850',
    nullable: true,
  })
  departmentId!: string | null;

  @ApiProperty({
    enum: WorkflowInstanceStatus,
    example: WorkflowInstanceStatus.ACTIVE,
  })
  status!: WorkflowInstanceStatus;

  @ApiProperty({ example: { amount: 55000, currency: 'BDT' }, nullable: true })
  metadataJson!: Record<string, unknown> | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-10T10:15:00.000Z',
    nullable: true,
  })
  startedAt!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-10T12:15:00.000Z',
    nullable: true,
  })
  completedAt!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-10T12:15:00.000Z',
    nullable: true,
  })
  rejectedAt!: string | null;

  @ApiProperty({ type: [WorkflowStepResponseDto] })
  steps!: WorkflowStepResponseDto[];

  @ApiProperty({ type: [WorkflowActionResponseDto] })
  actions!: WorkflowActionResponseDto[];

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  updatedAt!: string;
}
