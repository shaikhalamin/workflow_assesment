import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateBillingRequestDto {
  @ApiProperty({ example: 'Enterprise internet installation' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    type: String,
    example: 'One-time setup fee for corporate customer',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ example: 'ACME Bangladesh Ltd.' })
  @IsString()
  customerName!: string;

  @ApiPropertyOptional({
    type: String,
    example: 'billing@acme.example',
  })
  @IsOptional()
  @IsEmail()
  customerEmail?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Gulshan Avenue, Dhaka',
  })
  @IsOptional()
  @IsString()
  customerAddress?: string | null;

  @ApiProperty({ minimum: 0, example: 125000 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ default: 'BDT', example: 'BDT' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'Installation' })
  @IsString()
  billingCategory!: string;

  @ApiPropertyOptional({
    type: String,
    example: '61f1d2de-5733-4830-a97c-cb1899482850',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional({
    example: {
      projectCode: 'PRJ-2026-001',
      accountOwnerId: '71cb34da-1809-4c72-b132-2b9860be8936',
    },
  })
  @IsOptional()
  @IsObject()
  customFieldsJson?: Record<string, unknown> | null;
}
