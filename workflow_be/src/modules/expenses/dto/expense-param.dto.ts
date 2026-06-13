import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ExpenseParamDto {
  @ApiProperty({ example: '3dd466df-e730-4c87-8581-f57ec57d50f5' })
  @IsUUID()
  id!: string;
}
