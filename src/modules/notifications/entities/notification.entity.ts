import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotificationType {
  WORKFLOW_TASK_ASSIGNED = 'WORKFLOW_TASK_ASSIGNED',
  WORKFLOW_APPROVED = 'WORKFLOW_APPROVED',
  WORKFLOW_REJECTED = 'WORKFLOW_REJECTED',
  PAYMENT_REQUEST_CREATED = 'PAYMENT_REQUEST_CREATED',
  PAYMENT_PAID = 'PAYMENT_PAID',
  SYSTEM = 'SYSTEM',
}

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  recipientUserId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  recipientRoleSlug!: string | null;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column()
  entityType!: string;

  @Column()
  entityId!: string;

  @Column({ type: 'uuid', nullable: true })
  workflowInstanceId!: string | null;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
