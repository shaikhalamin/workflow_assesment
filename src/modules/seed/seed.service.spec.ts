import { SeedService } from './seed.service';
import type { Repository } from 'typeorm';
import {
  BillingRequest,
  BillingRequestStatus,
} from '../billing/entities/billing-request.entity';
import { Department } from '../departments/entities/department.entity';
import { Expense, ExpenseStatus } from '../expenses/entities/expense.entity';
import {
  LeaveRequest,
  LeaveRequestStatus,
} from '../leaves/entities/leave-request.entity';
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
import {
  WorkflowAssigneeType,
  WorkflowTemplateStatus,
} from '../workflow-builder/enums/workflow-builder.enums';

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
    const expensesRepository = createMockRepository<Expense>('expense');
    const leavesRepository = createMockRepository<LeaveRequest>('leave');
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
      asRepository(expensesRepository),
      asRepository(leavesRepository),
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

  it('seeds requested workflow definitions and demo requests without deleting existing data on development startup', async () => {
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
    const expensesRepository = createMockRepository<Expense>('expense');
    const leavesRepository = createMockRepository<LeaveRequest>('leave');
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
      expensesRepository,
      leavesRepository,
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
      asRepository(expensesRepository),
      asRepository(leavesRepository),
    );
    usersRepository.findOneBy.mockImplementation(
      (where: Record<string, unknown>) => {
        if (where.email === 'employee@example.com') {
          return Promise.resolve({
            id: 'employee-user-id',
            email: 'employee@example.com',
            name: 'Employee User',
          } as User);
        }
        if (where.email === 'cfo@example.com') {
          return Promise.resolve({
            id: 'cfo-user-id',
            email: 'cfo@example.com',
            name: 'CFO User',
          } as User);
        }
        if (where.email === 'hr.manager@example.com') {
          return Promise.resolve({
            id: 'hr-manager-user-id',
            email: 'hr.manager@example.com',
            name: 'HR Manager',
          } as User);
        }
        return Promise.resolve(null);
      },
    );
    departmentsRepository.findOneBy.mockImplementation(
      (where: Record<string, unknown>) => {
        if (where.slug === 'sales') {
          return Promise.resolve({
            id: 'sales-department-id',
            name: 'Sales',
            slug: 'sales',
          } as Department);
        }
        return Promise.resolve(null);
      },
    );

    await service.onApplicationBootstrap();

    expect(workflowTemplatesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Expense Approval Workflow',
        moduleName: 'expenses',
        eventName: 'expense.submitted',
        entityType: 'Expense',
        status: WorkflowTemplateStatus.PUBLISHED,
        priority: 1,
        allowResubmission: true,
        description: 'Routes submitted expense requests over 2000 BDT.',
        effectiveTo: new Date('2028-12-31T23:59:59.000Z'),
      }),
    );
    const savedWorkflowTemplates =
      workflowTemplatesRepository.save.mock.calls.map(([template]) => template);
    const savedExpenseTemplate = savedWorkflowTemplates.find(
      (template) => template.name === 'Expense Approval Workflow',
    );
    expect(savedExpenseTemplate?.effectiveFrom).toBeInstanceOf(Date);
    expect(workflowTemplatesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Leave Approval Workflow',
        moduleName: 'leaves',
        eventName: 'leave.submitted',
        entityType: 'LeaveRequest',
        status: WorkflowTemplateStatus.PUBLISHED,
        priority: 1,
        allowResubmission: true,
        description: 'Routes submitted leave requests over 2 days.',
      }),
    );
    expect(workflowTemplatesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Billing Approval Workflow',
        moduleName: 'billing',
        eventName: 'billing.submitted',
        entityType: 'BillingRequest',
        status: WorkflowTemplateStatus.PUBLISHED,
        priority: 1,
        allowResubmission: true,
        description: 'Routes submitted billing requests over 2500 BDT.',
      }),
    );
    expect(workflowTriggerConditionsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        conditionJson: {
          mode: 'all',
          conditions: [],
        },
      }),
    );
    expect(workflowApprovalRulesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Expense rule over 2000 BDT',
        priority: 1,
        conditionJson: {
          mode: 'all',
          conditions: [{ field: 'amount', operator: 'gte', value: 2000 }],
        },
        isActive: true,
      }),
    );
    expect(workflowApprovalStepConfigsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        stepOrder: 1,
        stepName: 'Requester manager approval',
        assigneeType: WorkflowAssigneeType.REQUESTER_MANAGER,
      }),
    );
    expect(workflowApprovalStepConfigsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        stepOrder: 2,
        stepName: 'Accounts officer approval',
        assigneeType: WorkflowAssigneeType.ROLE,
        assigneeRoleSlug: 'accounts-officer',
      }),
    );
    expect(workflowApprovalStepConfigsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        stepOrder: 3,
        stepName: 'CFO approval',
        assigneeType: WorkflowAssigneeType.USER,
        assigneeUserId: 'cfo-user-id',
      }),
    );
    expect(workflowApprovalRulesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Leave rule over 2 days',
        priority: 1,
        conditionJson: {
          mode: 'all',
          conditions: [{ field: 'leaveDays', operator: 'gte', value: 3 }],
        },
      }),
    );
    expect(workflowApprovalStepConfigsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        stepOrder: 2,
        stepName: 'HR officer approval',
        assigneeType: WorkflowAssigneeType.ROLE,
        assigneeRoleSlug: 'hr-officer',
      }),
    );
    expect(workflowApprovalStepConfigsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        stepOrder: 3,
        stepName: 'HR manager approval',
        assigneeType: WorkflowAssigneeType.USER,
        assigneeUserId: 'hr-manager-user-id',
      }),
    );
    expect(workflowApprovalRulesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Invoice bill over 2500 BDT',
        priority: 1,
        conditionJson: {
          mode: 'all',
          conditions: [{ field: 'amount', operator: 'gte', value: 2500 }],
        },
      }),
    );
    expect(expensesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Seed expense request over 2000 BDT',
        amount: '2500',
        currency: 'BDT',
        status: ExpenseStatus.DRAFT,
      }),
    );
    expect(leavesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        leaveType: 'ANNUAL',
        leaveDays: 3,
        status: LeaveRequestStatus.DRAFT,
      }),
    );
    expect(billingRequestsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Seed billing request over 2500 BDT',
        amount: '3000',
        currency: 'BDT',
        status: BillingRequestStatus.DRAFT,
      }),
    );

    for (const repository of repositories) {
      expect(repository.delete).not.toHaveBeenCalled();
    }
  });
});
