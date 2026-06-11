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

  @ApiProperty({ example: 'expense-2026-0001' })
  @IsString()
  entityId!: string;

  @ApiProperty({ example: '71cb34da-1809-4c72-b132-2b9860be8936' })
  @IsUUID()
  requesterId!: string;

  @ApiPropertyOptional({
    type: String,
    example: '61f1d2de-5733-4830-a97c-cb1899482850',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional({ example: { amount: 55000, currency: 'BDT' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
