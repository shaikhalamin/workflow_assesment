import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  WorkflowAssigneeType,
  WorkflowStepType,
} from '../enums/workflow-builder.enums';

export class CreateWorkflowStepConfigDto {
  @ApiProperty({ minimum: 1, example: 1 })
  @IsInt()
  @Min(1)
  stepOrder!: number;

  @ApiProperty({ example: 'Finance review' })
  @IsString()
  stepName!: string;

  @ApiProperty({ enum: WorkflowStepType })
  @IsEnum(WorkflowStepType)
  stepType!: WorkflowStepType;

  @ApiProperty({ enum: WorkflowAssigneeType })
  @IsEnum(WorkflowAssigneeType)
  assigneeType!: WorkflowAssigneeType;

  @ApiPropertyOptional({ type: String, example: 'finance-admin' })
  @IsOptional()
  @IsString()
  assigneeRoleSlug?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '71cb34da-1809-4c72-b132-2b9860be8936',
  })
  @IsOptional()
  @IsUUID()
  assigneeUserId?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'customFields.budgetOwnerId',
  })
  @IsOptional()
  @IsString()
  assigneeFieldPath?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresComment?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  canReject?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  canReassign?: boolean;

  @ApiPropertyOptional({ type: Number, minimum: 1, example: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  slaHours?: number | null;

  @ApiPropertyOptional({ enum: WorkflowAssigneeType })
  @IsOptional()
  @IsEnum(WorkflowAssigneeType)
  escalationAssigneeType?: WorkflowAssigneeType | null;

  @ApiPropertyOptional({ type: String, example: 'department-head' })
  @IsOptional()
  @IsString()
  escalationAssigneeRoleSlug?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '71cb34da-1809-4c72-b132-2b9860be8936',
  })
  @IsOptional()
  @IsUUID()
  escalationAssigneeUserId?: string | null;
}
