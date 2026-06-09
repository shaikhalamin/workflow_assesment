import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ default: 'BDT' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendor?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  itemValue?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  customFieldsJson?: Record<string, unknown> | null;
}
