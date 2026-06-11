import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PaymentRequestParamDto {
  @ApiProperty({ example: 'payment-2026-0001' })
  @IsString()
  id!: string;
}
