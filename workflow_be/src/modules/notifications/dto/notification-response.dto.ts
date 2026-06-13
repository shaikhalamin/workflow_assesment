import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

export class NotificationResponseDto {
  @ApiProperty({ example: '8b83330a-391d-4e25-9ec4-1f42623f91e4' })
  id!: string;

  @ApiProperty({ example: 'Workflow task assigned' })
  title!: string;

  @ApiProperty({ example: 'Expense needs approval' })
  message!: string;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.WORKFLOW_TASK_ASSIGNED,
  })
  type!: NotificationType;

  @ApiProperty({ example: 'Expense' })
  entityType!: string;

  @ApiProperty({ example: 'expense-2026-0001' })
  entityId!: string;

  @ApiProperty({
    type: String,
    example: '6a93b372-bf1f-4b9c-9e31-85554de8147e',
    nullable: true,
  })
  workflowInstanceId!: string | null;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-13T10:05:00.000Z',
    nullable: true,
  })
  readAt!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-13T10:00:00.000Z',
  })
  createdAt!: string;
}
