import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '71cb34da-1809-4c72-b132-2b9860be8936' })
  id!: string;

  @ApiProperty({ example: 'Demo Employee' })
  name!: string;

  @ApiProperty({ example: 'employee@fiberathome.net' })
  email!: string;

  @ApiProperty({ type: String, example: 'EMP-001', nullable: true })
  employeeCode!: string | null;

  @ApiProperty({ type: String, example: 'M2', nullable: true })
  employeeGrade!: string | null;

  @ApiProperty({
    type: String,
    example: 'Software Engineer',
    nullable: true,
  })
  designation!: string | null;

  @ApiProperty({
    type: String,
    example: '61f1d2de-5733-4830-a97c-cb1899482850',
    nullable: true,
  })
  departmentId!: string | null;

  @ApiProperty({
    type: String,
    example: 'e96cf99d-c871-4f29-a7b6-1d2246ddc542',
    nullable: true,
  })
  managerId!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-10T09:30:00.000Z',
    nullable: true,
  })
  lastLoginAt!: string | null;

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  updatedAt!: string;
}
