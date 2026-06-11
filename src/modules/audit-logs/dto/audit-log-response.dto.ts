import { ApiProperty } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ example: '4f6c0138-5f7b-4e4f-a0f9-7ee2efc79c77' })
  id!: string;

  @ApiProperty({
    type: String,
    example: '71cb34da-1809-4c72-b132-2b9860be8936',
    nullable: true,
  })
  actorUserId!: string | null;

  @ApiProperty({ example: 'EXPENSE_SUBMITTED' })
  action!: string;

  @ApiProperty({ example: 'Expense' })
  entityType!: string;

  @ApiProperty({ example: 'expense-2026-0001' })
  entityId!: string;

  @ApiProperty({
    type: String,
    example: '9f527490-d2a2-44aa-994c-ffb91adf9df2',
    nullable: true,
  })
  workflowInstanceId!: string | null;

  @ApiProperty({
    type: String,
    example: 'e7c883f6-90e7-465e-8abc-4c7f8e5e7d4a',
    nullable: true,
  })
  workflowStepId!: string | null;

  @ApiProperty({ type: String, example: 'DRAFT', nullable: true })
  oldStatus!: string | null;

  @ApiProperty({ type: String, example: 'SUBMITTED', nullable: true })
  newStatus!: string | null;

  @ApiProperty({
    type: String,
    example: 'Submitted for approval',
    nullable: true,
  })
  comment!: string | null;

  @ApiProperty({
    type: String,
    example: 'Policy threshold met',
    nullable: true,
  })
  reason!: string | null;

  @ApiProperty({ example: { amount: 55000 }, nullable: true })
  metadataJson!: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  createdAt!: string;
}
