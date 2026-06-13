import { ApiProperty } from '@nestjs/swagger';
import { WorkflowUserResponseDto } from '../../workflow-runtime/dto/workflow-runtime-response.dto';
import { ExpenseStatus } from '../entities/expense.entity';

export class ExpenseResponseDto {
  @ApiProperty({ example: 'expense-2026-0001' })
  id!: string;

  @ApiProperty({ example: '71cb34da-1809-4c72-b132-2b9860be8936' })
  requesterId!: string;

  @ApiProperty({ type: WorkflowUserResponseDto, nullable: true })
  requester!: WorkflowUserResponseDto | null;

  @ApiProperty({
    type: String,
    example: 'f33b2ef8-0c6d-4d22-b9c7-8592cb4e5037',
    nullable: true,
  })
  createdById!: string | null;

  @ApiProperty({ type: WorkflowUserResponseDto, nullable: true })
  createdBy!: WorkflowUserResponseDto | null;

  @ApiProperty({
    type: String,
    example: '61f1d2de-5733-4830-a97c-cb1899482850',
    nullable: true,
  })
  departmentId!: string | null;

  @ApiProperty({ example: 'Laptop charger reimbursement' })
  title!: string;

  @ApiProperty({
    type: String,
    example: 'Replacement charger for office laptop',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: '4500.00' })
  amount!: string;

  @ApiProperty({ example: 'BDT' })
  currency!: string;

  @ApiProperty({ example: 'Office supplies' })
  category!: string;

  @ApiProperty({ type: String, example: 'Star Tech', nullable: true })
  vendor!: string | null;

  @ApiProperty({ type: String, example: '4500.00', nullable: true })
  itemValue!: string | null;

  @ApiProperty({ type: String, example: '4500.00', nullable: true })
  price!: string | null;

  @ApiProperty({ type: String, example: '1.00', nullable: true })
  quantity!: string | null;

  @ApiProperty({ enum: ExpenseStatus, example: ExpenseStatus.DRAFT })
  status!: ExpenseStatus;

  @ApiProperty({
    type: String,
    example: '9f527490-d2a2-44aa-994c-ffb91adf9df2',
    nullable: true,
  })
  workflowInstanceId!: string | null;

  @ApiProperty({ example: false })
  canResubmit!: boolean;

  @ApiProperty({ type: String, example: 'Receipt missing', nullable: true })
  rejectionReason!: string | null;

  @ApiProperty({
    example: { invoiceNo: 'INV-2026-001', budgetCode: 'IT-OPS' },
    nullable: true,
  })
  customFieldsJson!: Record<string, unknown> | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-10T10:15:00.000Z',
    nullable: true,
  })
  submittedAt!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-10T12:15:00.000Z',
    nullable: true,
  })
  approvedAt!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-10T12:15:00.000Z',
    nullable: true,
  })
  rejectedAt!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-11T09:00:00.000Z',
    nullable: true,
  })
  paidAt!: string | null;

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  updatedAt!: string;
}
