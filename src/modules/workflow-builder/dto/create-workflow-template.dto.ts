import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import type { ConditionGroup } from '../condition.types';
import { WorkflowTemplateStatus } from '../enums/workflow-builder.enums';

export class CreateWorkflowTemplateDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ example: 'expenses' })
  @IsString()
  moduleName!: string;

  @ApiProperty({ example: 'expense.submitted' })
  @IsString()
  eventName!: string;

  @ApiProperty({ example: 'Expense' })
  @IsString()
  entityType!: string;

  @ApiPropertyOptional({ enum: WorkflowTemplateStatus })
  @IsOptional()
  @IsEnum(WorkflowTemplateStatus)
  status?: WorkflowTemplateStatus;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFrom?: Date | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveTo?: Date | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowResubmission?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  createdById?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  triggerConditionJson?: ConditionGroup | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  approvedActionsJson?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rejectedActionsJson?: Record<string, unknown> | null;
}
