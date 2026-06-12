import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class InvoiceParamDto {
  @ApiProperty({ example: 'd1813f59-2289-4a01-9ddd-a93c6cf4fd14' })
  @IsUUID()
  id!: string;
}
