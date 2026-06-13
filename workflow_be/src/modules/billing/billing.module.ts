import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { WorkflowRuntimeModule } from '../workflow-runtime/workflow-runtime.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingRequest } from './entities/billing-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillingRequest]),
    AuditLogsModule,
    WorkflowRuntimeModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [TypeOrmModule, BillingService],
})
export class BillingModule {}
