import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateLeaveDto {
  @ApiProperty({ example: 'ANNUAL' })
  @IsString()
  leaveType!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  leaveDays!: number;

  @ApiProperty({ example: '2026-06-10' })
  @IsString()
  startDate!: string;

  @ApiProperty({ example: '2026-06-11' })
  @IsString()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeGrade?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  customFieldsJson?: Record<string, unknown> | null;
}
