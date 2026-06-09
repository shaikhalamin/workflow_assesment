import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'expenses' })
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  requesterId!: string;

  @Column({ type: 'uuid', nullable: true })
  departmentId!: string | null;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: string;

  @Column({ default: 'BDT' })
  currency!: string;

  @Column()
  category!: string;

  @Column({ nullable: true })
  vendor!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  itemValue!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  price!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  quantity!: string | null;

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.DRAFT })
  status!: ExpenseStatus;

  @Column({ type: 'uuid', nullable: true })
  workflowInstanceId!: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  customFieldsJson!: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
