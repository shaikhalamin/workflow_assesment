import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingRequest } from '../billing/entities/billing-request.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { LeaveRequest } from '../leaves/entities/leave-request.entity';
import { PaymentRequest } from '../payments/entities/payment-request.entity';
import { WorkflowInstance } from '../workflow-runtime/entities/workflow-instance.entity';
import { WorkflowStep } from '../workflow-runtime/entities/workflow-step.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Expense,
      BillingRequest,
      Invoice,
      LeaveRequest,
      WorkflowStep,
      PaymentRequest,
      WorkflowInstance,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
