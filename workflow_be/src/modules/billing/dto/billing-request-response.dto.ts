import { ApiProperty } from '@nestjs/swagger';
import { WorkflowUserResponseDto } from '../../workflow-runtime/dto/workflow-runtime-response.dto';
import { BillingRequestStatus } from '../entities/billing-request.entity';

export class BillingRequestResponseDto {
  @ApiProperty({ example: '3dd466df-e730-4c87-8581-f57ec57d50f5' })
  id!: string;

  @ApiProperty({ example: '71cb34da-1809-4c72-b132-2b9860be8936' })
  requesterId!: string;

  @ApiProperty({ type: WorkflowUserResponseDto, nullable: true })
  requester!: WorkflowUserResponseDto | null;

  @ApiProperty({
    type: String,
    example: '61f1d2de-5733-4830-a97c-cb1899482850',
    nullable: true,
  })
  departmentId!: string | null;

  @ApiProperty({ example: 'ACME Bangladesh Ltd.' })
  customerName!: string;

  @ApiProperty({
    type: String,
    example: 'billing@acme.example',
    nullable: true,
  })
  customerEmail!: string | null;

  @ApiProperty({
    type: String,
    example: 'Gulshan Avenue, Dhaka',
    nullable: true,
  })
  customerAddress!: string | null;

  @ApiProperty({ example: 'Enterprise internet installation' })
  title!: string;

  @ApiProperty({
    type: String,
    example: 'One-time setup fee for corporate customer',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: '125000.00' })
  amount!: string;

  @ApiProperty({ example: 'BDT' })
  currency!: string;

  @ApiProperty({ example: 'Installation' })
  billingCategory!: string;

  @ApiProperty({
    enum: BillingRequestStatus,
    example: BillingRequestStatus.DRAFT,
  })
  status!: BillingRequestStatus;

  @ApiProperty({
    type: String,
    example: '9f527490-d2a2-44aa-994c-ffb91adf9df2',
    nullable: true,
  })
  workflowInstanceId!: string | null;

  @ApiProperty({
    type: String,
    example: 'd1813f59-2289-4a01-9ddd-a93c6cf4fd14',
    nullable: true,
  })
  invoiceId!: string | null;

  @ApiProperty({ example: false })
  canResubmit!: boolean;

  @ApiProperty({ type: String, example: 'Customer PO missing', nullable: true })
  rejectionReason!: string | null;

  @ApiProperty({
    example: {
      projectCode: 'PRJ-2026-001',
      accountOwnerId: '71cb34da-1809-4c72-b132-2b9860be8936',
    },
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

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-10T10:15:00.000Z' })
  updatedAt!: string;
}
