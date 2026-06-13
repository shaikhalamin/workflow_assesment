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
  @ApiProperty({ example: 'Expense approval workflow' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Routes expenses through finance approval',
  })
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

  @ApiPropertyOptional({ minimum: 0, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-06-10T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFrom?: Date | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveTo?: Date | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowResubmission?: boolean;

  @ApiPropertyOptional({
    type: String,
    example: '71cb34da-1809-4c72-b132-2b9860be8936',
  })
  @IsOptional()
  @IsUUID()
  createdById?: string | null;

  @ApiPropertyOptional({
    example: {
      mode: 'all',
      conditions: [{ field: 'amount', operator: 'gte', value: 50000 }],
    },
  })
  @IsOptional()
  @IsObject()
  triggerConditionJson?: ConditionGroup | null;

  @ApiPropertyOptional({
    example: { setStatus: 'APPROVED', createPaymentRequest: true },
  })
  @IsOptional()
  @IsObject()
  approvedActionsJson?: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: { setStatus: 'REJECTED' } })
  @IsOptional()
  @IsObject()
  rejectedActionsJson?: Record<string, unknown> | null;
}
