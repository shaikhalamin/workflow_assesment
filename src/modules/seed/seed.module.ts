import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingRequest } from '../billing/entities/billing-request.entity';
import { Department } from '../departments/entities/department.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { LeaveRequest } from '../leaves/entities/leave-request.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { RolePermission } from '../rbac/entities/role-permission.entity';
import { Role } from '../rbac/entities/role.entity';
import { UserRole } from '../rbac/entities/user-role.entity';
import { User } from '../users/entities/user.entity';
import { WorkflowApprovalRule } from '../workflow-builder/entities/workflow-approval-rule.entity';
import { WorkflowApprovalStepConfig } from '../workflow-builder/entities/workflow-approval-step-config.entity';
import { WorkflowEventSchema } from '../workflow-builder/entities/workflow-event-schema.entity';
import { WorkflowOutcomeConfig } from '../workflow-builder/entities/workflow-outcome-config.entity';
import { WorkflowTemplate } from '../workflow-builder/entities/workflow-template.entity';
import { WorkflowTriggerCondition } from '../workflow-builder/entities/workflow-trigger-condition.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Department,
      Role,
      Permission,
      RolePermission,
      UserRole,
      User,
      WorkflowTemplate,
      WorkflowEventSchema,
      WorkflowTriggerCondition,
      WorkflowApprovalRule,
      WorkflowApprovalStepConfig,
      WorkflowOutcomeConfig,
      BillingRequest,
      Expense,
      LeaveRequest,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
