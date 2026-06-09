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
  @ApiProperty({ minimum: 1 })
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

  @ApiPropertyOptional({ example: 'finance-admin' })
  @IsOptional()
  @IsString()
  assigneeRoleSlug?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeUserId?: string | null;

  @ApiPropertyOptional({ example: 'customFields.budgetOwnerId' })
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

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresAttachment?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  canReject?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  canReassign?: boolean;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  slaHours?: number | null;

  @ApiPropertyOptional({ enum: WorkflowAssigneeType })
  @IsOptional()
  @IsEnum(WorkflowAssigneeType)
  escalationAssigneeType?: WorkflowAssigneeType | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  escalationAssigneeRoleSlug?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  escalationAssigneeUserId?: string | null;
}
