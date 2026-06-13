import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuditLogEntityParamDto {
  @ApiProperty({ example: 'Expense' })
  @IsString()
  entityType!: string;

  @ApiProperty({ example: 'expense-2026-0001' })
  @IsString()
  entityId!: string;
}

export class AuditLogWorkflowParamDto {
  @ApiProperty({ example: '9f527490-d2a2-44aa-994c-ffb91adf9df2' })
  @IsString()
  workflowInstanceId!: string;
}
