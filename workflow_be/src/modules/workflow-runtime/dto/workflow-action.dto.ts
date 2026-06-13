import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class WorkflowActionDto {
  @ApiPropertyOptional({ example: 'Approved after checking documents' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: 'Budget verified' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: { reviewedBy: 'finance-admin' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
