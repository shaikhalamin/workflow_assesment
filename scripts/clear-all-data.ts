import 'reflect-metadata';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { IsNull, Not, type EntityTarget } from 'typeorm';
import { AppDataSource } from '../src/database/data-source';
import { AuditLog } from '../src/modules/audit-logs/entities/audit-log.entity';
import { RefreshTokenSession } from '../src/modules/auth/entities/refresh-token-session.entity';
import { Department } from '../src/modules/departments/entities/department.entity';
import { Expense } from '../src/modules/expenses/entities/expense.entity';
import { LeaveRequest } from '../src/modules/leaves/entities/leave-request.entity';
import { Notification } from '../src/modules/notifications/entities/notification.entity';
import { PaymentRequest } from '../src/modules/payments/entities/payment-request.entity';
import { Permission } from '../src/modules/rbac/entities/permission.entity';
import { RolePermission } from '../src/modules/rbac/entities/role-permission.entity';
import { Role } from '../src/modules/rbac/entities/role.entity';
import { UserRole } from '../src/modules/rbac/entities/user-role.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { WorkflowApprovalRule } from '../src/modules/workflow-builder/entities/workflow-approval-rule.entity';
import { WorkflowApprovalStepConfig } from '../src/modules/workflow-builder/entities/workflow-approval-step-config.entity';
import { WorkflowEventSchema } from '../src/modules/workflow-builder/entities/workflow-event-schema.entity';
import { WorkflowOutcomeConfig } from '../src/modules/workflow-builder/entities/workflow-outcome-config.entity';
import { WorkflowTemplate } from '../src/modules/workflow-builder/entities/workflow-template.entity';
import { WorkflowTriggerCondition } from '../src/modules/workflow-builder/entities/workflow-trigger-condition.entity';
import { WorkflowAction } from '../src/modules/workflow-runtime/entities/workflow-action.entity';
import { WorkflowInstance } from '../src/modules/workflow-runtime/entities/workflow-instance.entity';
import { WorkflowStep } from '../src/modules/workflow-runtime/entities/workflow-step.entity';

interface EntityWithId {
  id: string;
}

interface ClearTarget {
  tableName: string;
  target: EntityTarget<EntityWithId>;
}

export const CLEAR_ALL_DATA_TABLES = [
  'audit_logs',
  'notifications',
  'payment_requests',
  'workflow_actions',
  'workflow_steps',
  'expenses',
  'leave_requests',
  'workflow_instances',
  'workflow_approval_step_configs',
  'workflow_trigger_conditions',
  'workflow_outcome_configs',
  'workflow_approval_rules',
  'workflow_templates',
  'workflow_event_schemas',
  'refresh_token_sessions',
  'user_roles',
  'role_permissions',
  'users',
  'departments',
  'roles',
  'permissions',
] as const;

const CLEAR_TARGETS: readonly ClearTarget[] = [
  { tableName: 'audit_logs', target: AuditLog },
  { tableName: 'notifications', target: Notification },
  { tableName: 'payment_requests', target: PaymentRequest },
  { tableName: 'workflow_actions', target: WorkflowAction },
  { tableName: 'workflow_steps', target: WorkflowStep },
  { tableName: 'expenses', target: Expense },
  { tableName: 'leave_requests', target: LeaveRequest },
  { tableName: 'workflow_instances', target: WorkflowInstance },
  {
    tableName: 'workflow_approval_step_configs',
    target: WorkflowApprovalStepConfig,
  },
  {
    tableName: 'workflow_trigger_conditions',
    target: WorkflowTriggerCondition,
  },
  { tableName: 'workflow_outcome_configs', target: WorkflowOutcomeConfig },
  { tableName: 'workflow_approval_rules', target: WorkflowApprovalRule },
  { tableName: 'workflow_templates', target: WorkflowTemplate },
  { tableName: 'workflow_event_schemas', target: WorkflowEventSchema },
  { tableName: 'refresh_token_sessions', target: RefreshTokenSession },
  { tableName: 'user_roles', target: UserRole },
  { tableName: 'role_permissions', target: RolePermission },
  { tableName: 'users', target: User },
  { tableName: 'departments', target: Department },
  { tableName: 'roles', target: Role },
  { tableName: 'permissions', target: Permission },
];

function usage(): void {
  console.log('Usage: pnpm clear:all -- [--yes]');
  console.log('');
  console.log('Clears all TypeORM entity data, including users, roles,');
  console.log('permissions, user_roles, role_permissions, and departments.');
}

function parseArgs(args: readonly string[]): boolean {
  let assumeYes = false;

  for (const arg of args) {
    if (arg === '--') continue;

    if (arg === '--yes' || arg === '-y') {
      assumeYes = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return assumeYes;
}

async function confirmClear(assumeYes: boolean): Promise<boolean> {
  if (assumeYes) return true;

  const readline = createInterface({ input, output });
  const answer = await readline.question(
    '\nType YES to delete all application data: ',
  );
  readline.close();

  return answer === 'YES';
}

export async function clearAllData(): Promise<void> {
  const dataSource = await AppDataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      for (const { tableName, target } of CLEAR_TARGETS) {
        const result = await manager
          .getRepository(target)
          .delete({ id: Not(IsNull()) });
        console.log(`${tableName}: deleted ${result.affected ?? 0}`);
      }
    });
  } finally {
    await dataSource.destroy();
  }
}

async function main(): Promise<void> {
  const assumeYes = parseArgs(process.argv.slice(2));

  console.log('Tables to clear:');
  for (const table of CLEAR_ALL_DATA_TABLES) {
    console.log(`  ${table}`);
  }

  if (!(await confirmClear(assumeYes))) {
    console.log('Aborted.');
    return;
  }

  await clearAllData();
  console.log('All data cleared successfully.');
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
