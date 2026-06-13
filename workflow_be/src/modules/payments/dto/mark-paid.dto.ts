import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MarkPaidDto {
  @ApiPropertyOptional({ example: 'BANK-TXN-2026-0001' })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}
