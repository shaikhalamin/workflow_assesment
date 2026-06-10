import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Laptop charger reimbursement' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Replacement charger for office laptop',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ minimum: 0, example: 4500 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ default: 'BDT' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'Office supplies' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ type: String, example: 'Star Tech' })
  @IsOptional()
  @IsString()
  vendor?: string | null;

  @ApiPropertyOptional({ type: Number, example: 4500 })
  @IsOptional()
  @IsNumber()
  itemValue?: number | null;

  @ApiPropertyOptional({ type: Number, example: 4500 })
  @IsOptional()
  @IsNumber()
  price?: number | null;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @IsNumber()
  quantity?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: '61f1d2de-5733-4830-a97c-cb1899482850',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional({
    example: { invoiceNo: 'INV-2026-001', budgetCode: 'IT-OPS' },
  })
  @IsOptional()
  @IsObject()
  customFieldsJson?: Record<string, unknown> | null;
}
