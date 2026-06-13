import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum InvoiceStatus {
  ISSUED = 'ISSUED',
  CANCELLED = 'CANCELLED',
  PAID = 'PAID',
}

@Entity({ name: 'invoices' })
@Unique(['billingRequestId'])
@Unique(['invoiceNumber'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  billingRequestId!: string;

  @Column()
  invoiceNumber!: string;

  @Column({ type: 'uuid' })
  requesterId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requesterId' })
  requester!: User;

  @Column({ type: 'uuid', nullable: true })
  departmentId!: string | null;

  @Column()
  customerName!: string;

  @Column({ type: 'varchar', nullable: true })
  customerEmail!: string | null;

  @Column({ type: 'text', nullable: true })
  customerAddress!: string | null;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: string;

  @Column({ default: 'BDT' })
  currency!: string;

  @Column({ type: 'date' })
  dueDate!: string;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.ISSUED })
  status!: InvoiceStatus;

  @Column({ type: 'timestamptz' })
  issuedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
