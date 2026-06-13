import { SeedService } from './seed.service';
import type { Repository } from 'typeorm';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { BillingRequest } from '../billing/entities/billing-request.entity';
import { Department } from '../departments/entities/department.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
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
import { WorkflowTemplateStatus } from '../workflow-builder/enums/workflow-builder.enums';
import { WorkflowAction } from '../workflow-runtime/entities/workflow-action.entity';
import { WorkflowInstance } from '../workflow-runtime/entities/workflow-instance.entity';
import { WorkflowStep } from '../workflow-runtime/entities/workflow-step.entity';

type MockRepository<T extends object> = {
  findOneBy: jest.Mock<Promise<T | null>, [Record<string, unknown>]>;
  find: jest.Mock<Promise<T[]>, [unknown?]>;
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
      'sales-officer',
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

  it('defines seeded workflow templates for billing, expense, and leave', () => {
    expect(
      SeedService.workflowTemplateSeeds.map((workflow) => workflow.name),
    ).toEqual([
      'Billing Approval Workflow',
      'Expense Approval Workflow',
      'Leave Approval Workflow',
    ]);
  });

  it('uses employee as the baseline self-service role', () => {
    const employeePermissions = SeedService.rolePermissionSeeds.find(
      (seed) => seed.roleSlug === 'employee',
    )?.permissionSlugs;

    expect(SeedService.permissionSeeds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Read workflow runtime',
          slug: 'workflow.runtime.read',
          resource: 'workflow-runtime',
          action: 'read',
        }),
      ]),
    );
    expect(employeePermissions).toEqual(
      expect.arrayContaining([
        'auth.profile.read',
        'dashboard.read',
        'workflow.runtime.read',
        'workflow.runtime.act',
        'expenses.read',
        'expenses.write',
        'leaves.read',
        'leaves.write',
        'billing.read',
        'billing.write',
        'invoices.read',
        'payments.read',
        'audit.read',
      ]),
    );
    expect(employeePermissions).not.toContain('payments.write');
    expect(employeePermissions).not.toContain('invoices.write');
  });

  it('keeps payment write permission with finance payment roles only', () => {
    const paymentWriterRoleSlugs = SeedService.rolePermissionSeeds
      .filter((seed) => seed.permissionSlugs.includes('payments.write'))
      .map((seed) => seed.roleSlug)
      .sort();

    expect(paymentWriterRoleSlugs).toEqual([
      'accounts-officer',
      'cfo',
      'finance-admin',
      'payroll-officer',
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

  it('assigns the employee role to every seeded non-admin employee account', () => {
    const nonAdminUsers = SeedService.userSeeds.filter(
      (user) => !user.roles.includes('admin'),
    );

    expect(nonAdminUsers.length).toBeGreaterThan(0);
    for (const user of nonAdminUsers) {
      expect(user.roles).toContain('employee');
    }
  });

  it('keeps the demo employee account on the employee role only', () => {
    const employeeUser = SeedService.userSeeds.find(
      (user) => user.email === 'employee@example.com',
    );

    expect(employeeUser?.roles).toEqual(['employee']);
  });

  it('removes stale roles from seeded demo users', async () => {
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
    const billingRequestsRepository =
      createMockRepository<BillingRequest>('billing-request');
    const invoicesRepository = createMockRepository<Invoice>('invoice');
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
    const roles: Role[] = SeedService.roleSeeds.map((seed) => ({
      id: `${seed.slug}-role-id`,
      slug: seed.slug,
      name: seed.name,
      description: seed.description ?? null,
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const users = new Map(
      SeedService.userSeeds.map((seed) => [
        seed.email,
        {
          id:
            seed.email === 'employee@example.com'
              ? 'employee-user-id'
              : `${seed.email}-id`,
          email: seed.email,
          name: seed.name,
          managerId: null,
          isActive: true,
        } as User,
      ]),
    );
    const staleSalesOfficerRole = roles.find(
      (role) => role.slug === 'sales-officer',
    );
    const staleUserRole = {
      id: 'stale-user-role-id',
      userId: 'employee-user-id',
      roleId: staleSalesOfficerRole?.id ?? 'sales-officer-role-id',
      createdAt: new Date(),
    } as UserRole;
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
      asRepository(billingRequestsRepository),
      asRepository(invoicesRepository),
      asRepository(expensesRepository),
      asRepository(leavesRepository),
      asRepository(paymentRequestsRepository),
      asRepository(auditLogsRepository),
      asRepository(notificationsRepository),
      asRepository(workflowInstancesRepository),
      asRepository(workflowStepsRepository),
      asRepository(workflowActionsRepository),
    );
    rolesRepository.find.mockResolvedValue(roles);
    usersRepository.findOneBy.mockImplementation(
      (where: Record<string, unknown>) => {
        const email = where.email;
        if (typeof email === 'string') {
          return Promise.resolve(users.get(email) ?? null);
        }
        return Promise.resolve(null);
      },
    );
    userRolesRepository.find.mockImplementation((options?: unknown) => {
      const where = (options as { where?: { userId?: string } } | undefined)
        ?.where;
      return Promise.resolve(
        where?.userId === 'employee-user-id' ? [staleUserRole] : [],
      );
    });

    await (
      service as unknown as { seedUsers: () => Promise<void> }
    ).seedUsers();

    expect(userRolesRepository.delete).toHaveBeenCalledWith({
      id: 'stale-user-role-id',
    });
  });

  it('seeds baseline workflow definitions without deleting existing data on development startup', async () => {
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
    const billingRequestsRepository =
      createMockRepository<BillingRequest>('billing-request');
    const invoicesRepository = createMockRepository<Invoice>('invoice');
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
      billingRequestsRepository,
      invoicesRepository,
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
      asRepository(billingRequestsRepository),
      asRepository(invoicesRepository),
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

    expect(workflowTemplatesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Expense Approval Workflow',
        moduleName: 'expenses',
        eventName: 'expense.submitted',
        entityType: 'Expense',
        status: WorkflowTemplateStatus.PUBLISHED,
      }),
    );
    expect(workflowTriggerConditionsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        conditionJson: {
          mode: 'all',
          conditions: [{ field: 'amount', operator: 'gte', value: 1 }],
        },
      }),
    );
    expect(workflowApprovalRulesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'High value expense',
        isActive: true,
      }),
    );
    expect(workflowApprovalStepConfigsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        stepName: 'Department review',
        assigneeRoleSlug: 'department-reviewer',
      }),
    );

    for (const repository of repositories) {
      expect(repository.delete).not.toHaveBeenCalled();
    }
  });
});
