import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from '../departments/entities/department.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingRequest } from '../billing/entities/billing-request.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { LeaveRequest } from '../leaves/entities/leave-request.entity';
import { PaymentRequest } from '../payments/entities/payment-request.entity';
import { RbacModule } from '../rbac/rbac.module';
import { User } from '../users/entities/user.entity';
import { WorkflowBuilderModule } from '../workflow-builder/workflow-builder.module';
import { WorkflowTemplate } from '../workflow-builder/entities/workflow-template.entity';
import { WorkflowApprovalRule } from '../workflow-builder/entities/workflow-approval-rule.entity';
import { WorkflowAction } from './entities/workflow-action.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { AssigneeResolverService } from './assignee-resolver.service';
import { OutcomeHandlerService } from './outcome-handler.service';
import { RuleEngineService } from './rule-engine.service';
import { WorkflowRuntimeController } from './workflow-runtime.controller';
import { WorkflowRuntimeService } from './workflow-runtime.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowInstance,
      WorkflowStep,
      WorkflowAction,
      WorkflowTemplate,
      WorkflowApprovalRule,
      User,
      Department,
      BillingRequest,
      Expense,
      Invoice,
      LeaveRequest,
      PaymentRequest,
    ]),
    AuditLogsModule,
    NotificationsModule,
    WorkflowBuilderModule,
    RbacModule,
  ],
  controllers: [WorkflowRuntimeController],
  providers: [
    RuleEngineService,
    AssigneeResolverService,
    OutcomeHandlerService,
    WorkflowRuntimeService,
  ],
  exports: [
    TypeOrmModule,
    RuleEngineService,
    AssigneeResolverService,
    OutcomeHandlerService,
    WorkflowRuntimeService,
  ],
})
export class WorkflowRuntimeModule {}
