import { SeedService } from './seed.service';
import type { Repository } from 'typeorm';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { Department } from '../departments/entities/department.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { LeaveRequest } from '../leaves/entities/leave-request.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { PaymentRequest } from '../payments/entities/payment-request.entity';
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
import { WorkflowAction } from '../workflow-runtime/entities/workflow-action.entity';
import { WorkflowInstance } from '../workflow-runtime/entities/workflow-instance.entity';
import { WorkflowStep } from '../workflow-runtime/entities/workflow-step.entity';

type MockRepository<T extends object> = {
  findOneBy: jest.Mock<Promise<T | null>, [Record<string, unknown>]>;
  find: jest.Mock<Promise<T[]>, []>;
  create: jest.Mock<T, [Partial<T>]>;
  save: jest.Mock<Promise<T>, [T]>;
  delete: jest.Mock<Promise<void>, [Record<string, unknown>]>;
  count: jest.Mock<Promise<number>, []>;
};

const createMockRepository = <T extends object>(
  idPrefix: string,
): MockRepository<T> => {
  let nextId = 1;
  return {
    findOneBy: jest.fn((where: Record<string, unknown>): Promise<T | null> => {
      void where;
      return Promise.resolve(null);
    }),
    find: jest.fn((): Promise<T[]> => Promise.resolve([])),
    create: jest.fn((entity: Partial<T>) => entity as T),
    save: jest.fn((entity: T) =>
      Promise.resolve({ id: `${idPrefix}-${nextId++}`, ...entity } as T),
    ),
    delete: jest.fn((where: Record<string, unknown>): Promise<void> => {
      void where;
      return Promise.resolve(undefined);
    }),
    count: jest.fn((): Promise<number> => Promise.resolve(0)),
  };
};

const asRepository = <T extends object>(
  repository: MockRepository<T>,
): Repository<T> => repository as unknown as Repository<T>;

describe('SeedService', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('uses stable role slugs required by the assessment', () => {
    expect(SeedService.roleSeeds.map((role) => role.slug)).toEqual([
      'employee',
      'department-reviewer',
      'manager',
      'accounts-officer',
      'finance-admin',
      'hr-officer',
      'hr-manager',
      'cfo',
      'payroll-officer',
      'admin',
    ]);
  });

  it('uses the shared development password marker', () => {
    expect(SeedService.developmentPassword).toBe('Password123!');
  });

  it('defines seeded workflow templates for expense, leave, and attendance', () => {
    expect(
      SeedService.workflowTemplateSeeds.map((workflow) => workflow.name),
    ).toEqual([
      'Expense Approval Workflow',
      'Leave Approval Workflow',
      'Attendance Adjustment Workflow',
    ]);
  });

  it('assigns sample employee metadata and a default manager', () => {
    for (const user of SeedService.userSeeds) {
      expect(user.employeeGrade).toEqual(expect.any(String));
      expect(user.departmentSlug).toEqual(expect.any(String));
      expect(user.departmentSlug).not.toBe('');

      if (user.name === 'Manager User') {
        expect(user.managerEmail).toBeUndefined();
      } else {
        expect(user.managerEmail).toBe('manager@example.com');
      }
    }
  });

  it('does not delete existing data or seed workflow definitions on development startup', async () => {
    process.env.NODE_ENV = 'development';
    const departmentsRepository = createMockRepository<Department>('dept');
    const rolesRepository = createMockRepository<Role>('role');
    const permissionsRepository =
      createMockRepository<Permission>('permission');
    const rolePermissionsRepository =
      createMockRepository<RolePermission>('role-permission');
    const userRolesRepository = createMockRepository<UserRole>('user-role');
    const usersRepository = createMockRepository<User>('user');
    const workflowTemplatesRepository =
      createMockRepository<WorkflowTemplate>('workflow-template');
    const workflowEventSchemasRepository =
      createMockRepository<WorkflowEventSchema>('workflow-event-schema');
    const workflowTriggerConditionsRepository =
      createMockRepository<WorkflowTriggerCondition>('workflow-trigger');
    const workflowApprovalRulesRepository =
      createMockRepository<WorkflowApprovalRule>('workflow-rule');
    const workflowApprovalStepConfigsRepository =
      createMockRepository<WorkflowApprovalStepConfig>('workflow-step-config');
    const workflowOutcomeConfigsRepository =
      createMockRepository<WorkflowOutcomeConfig>('workflow-outcome');
    const expensesRepository = createMockRepository<Expense>('expense');
    const leavesRepository = createMockRepository<LeaveRequest>('leave');
    const paymentRequestsRepository =
      createMockRepository<PaymentRequest>('payment');
    const auditLogsRepository = createMockRepository<AuditLog>('audit');
    const notificationsRepository =
      createMockRepository<Notification>('notification');
    const workflowInstancesRepository =
      createMockRepository<WorkflowInstance>('workflow-instance');
    const workflowStepsRepository =
      createMockRepository<WorkflowStep>('workflow-step');
    const workflowActionsRepository =
      createMockRepository<WorkflowAction>('workflow-action');
    const repositories = [
      departmentsRepository,
      rolesRepository,
      permissionsRepository,
      rolePermissionsRepository,
      userRolesRepository,
      usersRepository,
      workflowTemplatesRepository,
      workflowEventSchemasRepository,
      workflowTriggerConditionsRepository,
      workflowApprovalRulesRepository,
      workflowApprovalStepConfigsRepository,
      workflowOutcomeConfigsRepository,
      expensesRepository,
      leavesRepository,
      paymentRequestsRepository,
      auditLogsRepository,
      notificationsRepository,
      workflowInstancesRepository,
      workflowStepsRepository,
      workflowActionsRepository,
    ];
    const service = new SeedService(
      asRepository(departmentsRepository),
      asRepository(rolesRepository),
      asRepository(permissionsRepository),
      asRepository(rolePermissionsRepository),
      asRepository(userRolesRepository),
      asRepository(usersRepository),
      asRepository(workflowTemplatesRepository),
      asRepository(workflowEventSchemasRepository),
      asRepository(workflowTriggerConditionsRepository),
      asRepository(workflowApprovalRulesRepository),
      asRepository(workflowApprovalStepConfigsRepository),
      asRepository(workflowOutcomeConfigsRepository),
      asRepository(expensesRepository),
      asRepository(leavesRepository),
      asRepository(paymentRequestsRepository),
      asRepository(auditLogsRepository),
      asRepository(notificationsRepository),
      asRepository(workflowInstancesRepository),
      asRepository(workflowStepsRepository),
      asRepository(workflowActionsRepository),
    );

    await service.onApplicationBootstrap();

    for (const repository of repositories) {
      expect(repository.delete).not.toHaveBeenCalled();
    }
    expect(workflowTemplatesRepository.save).not.toHaveBeenCalled();
    expect(workflowEventSchemasRepository.save).not.toHaveBeenCalled();
    expect(workflowApprovalRulesRepository.save).not.toHaveBeenCalled();
    expect(workflowApprovalStepConfigsRepository.save).not.toHaveBeenCalled();
  });
});
