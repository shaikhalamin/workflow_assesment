import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import type { WorkflowEventFieldSchema } from '../condition.types';

export class CreateWorkflowEventSchemaDto {
  @ApiProperty({ example: 'expenses' })
  @IsString()
  moduleName!: string;

  @ApiProperty({ example: 'expense.submitted' })
  @IsString()
  eventName!: string;

  @ApiProperty({ example: 'Expense' })
  @IsString()
  entityType!: string;

  @ApiProperty()
  @IsObject()
  fieldSchemaJson!: WorkflowEventFieldSchema;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  outcomeActionsJson?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  assigneeResolversJson?: Record<string, unknown> | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
