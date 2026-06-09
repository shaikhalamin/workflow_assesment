import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class TriggerWorkflowDto {
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
  @IsString()
  entityId!: string;

  @ApiProperty()
  @IsUUID()
  requesterId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
