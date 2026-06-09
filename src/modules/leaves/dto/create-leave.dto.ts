import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateLeaveDto {
  @ApiProperty({ example: 'ANNUAL' })
  @IsString()
  leaveType!: string;

  @ApiProperty({ minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  leaveDays!: number;

  @ApiProperty({ example: '2026-06-10' })
  @IsString()
  startDate!: string;

  @ApiProperty({ example: '2026-06-11' })
  @IsString()
  endDate!: string;

  @ApiPropertyOptional({ example: 'Family event' })
  @IsOptional()
  @IsString()
  reason?: string | null;

  @ApiPropertyOptional({ example: 'M2' })
  @IsOptional()
  @IsString()
  employeeGrade?: string | null;

  @ApiPropertyOptional({
    example: '61f1d2de-5733-4830-a97c-cb1899482850',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional({ example: { handoverTo: 'team-lead' } })
  @IsOptional()
  @IsObject()
  customFieldsJson?: Record<string, unknown> | null;
}
