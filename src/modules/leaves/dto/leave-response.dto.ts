import { ApiProperty } from '@nestjs/swagger';
import { LeaveRequestStatus } from '../entities/leave-request.entity';

export class LeaveResponseDto {
  @ApiProperty({ example: 'leave-2026-0001' })
  id!: string;

  @ApiProperty({ example: '71cb34da-1809-4c72-b132-2b9860be8936' })
  requesterId!: string;

  @ApiProperty({
    example: '61f1d2de-5733-4830-a97c-cb1899482850',
    nullable: true,
  })
  departmentId!: string | null;

  @ApiProperty({ example: 'ANNUAL' })
  leaveType!: string;

  @ApiProperty({ example: 2 })
  leaveDays!: number;

  @ApiProperty({ example: '2026-06-10' })
  startDate!: string;

  @ApiProperty({ example: '2026-06-11' })
  endDate!: string;

  @ApiProperty({ example: 'Family event', nullable: true })
  reason!: string | null;

  @ApiProperty({ example: 'M2', nullable: true })
  employeeGrade!: string | null;

  @ApiProperty({
    enum: LeaveRequestStatus,
    example: LeaveRequestStatus.DRAFT,
  })
  status!: LeaveRequestStatus;

  @ApiProperty({
    example: '9f527490-d2a2-44aa-994c-ffb91adf9df2',
    nullable: true,
  })
  workflowInstanceId!: string | null;

  @ApiProperty({ example: 'Insufficient balance', nullable: true })
  rejectionReason!: string | null;

  @ApiProperty({
    example: { startDate: '2026-06-10', endDate: '2026-06-11' },
    nullable: true,
  })
  approvedPeriodJson!: Record<string, unknown> | null;

  @ApiProperty({ example: { handoverTo: 'team-lead' }, nullable: true })
  customFieldsJson!: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z', nullable: true })
  submittedAt!: string | null;

  @ApiProperty({ example: '2026-06-10T12:15:00.000Z', nullable: true })
  approvedAt!: string | null;

  @ApiProperty({ example: '2026-06-10T12:15:00.000Z', nullable: true })
  rejectedAt!: string | null;

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  updatedAt!: string;
}
