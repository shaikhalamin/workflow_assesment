import { ApiProperty } from '@nestjs/swagger';
import { PaymentRequestStatus } from '../entities/payment-request.entity';

export class PaymentRequestResponseDto {
  @ApiProperty({ example: 'payment-2026-0001' })
  id!: string;

  @ApiProperty({ example: 'expense-2026-0001' })
  expenseId!: string;

  @ApiProperty({ example: '71cb34da-1809-4c72-b132-2b9860be8936' })
  requesterId!: string;

  @ApiProperty({ example: '4500.00' })
  amount!: string;

  @ApiProperty({ example: 'BDT' })
  currency!: string;

  @ApiProperty({
    enum: PaymentRequestStatus,
    example: PaymentRequestStatus.PENDING,
  })
  status!: PaymentRequestStatus;

  @ApiProperty({
    type: String,
    example: 'BANK-TXN-2026-0001',
    nullable: true,
  })
  paymentReference!: string | null;

  @ApiProperty({
    type: String,
    example: 'e96cf99d-c871-4f29-a7b6-1d2246ddc542',
    nullable: true,
  })
  paidById!: string | null;

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
