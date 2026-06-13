import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
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
import type { ConditionOperator } from '../workflow-builder/condition.types';
import { WorkflowApprovalRule } from '../workflow-builder/entities/workflow-approval-rule.entity';
import { WorkflowApprovalStepConfig } from '../workflow-builder/entities/workflow-approval-step-config.entity';
import { WorkflowEventSchema } from '../workflow-builder/entities/workflow-event-schema.entity';
import { WorkflowOutcomeConfig } from '../workflow-builder/entities/workflow-outcome-config.entity';
import { WorkflowTemplate } from '../workflow-builder/entities/workflow-template.entity';
import { WorkflowTriggerCondition } from '../workflow-builder/entities/workflow-trigger-condition.entity';
import {
  WorkflowAssigneeType,
  WorkflowStepType,
  WorkflowTemplateStatus,
} from '../workflow-builder/enums/workflow-builder.enums';

type DepartmentSeed = { name: string; slug: string };
type RoleSeed = { name: string; slug: string; description?: string };
type PermissionSeed = {
  name: string;
  slug: string;
  resource: string;
  action: string;
};
type RolePermissionSeed = { roleSlug: string; permissionSlugs: string[] };
type UserSeed = {
  name: string;
  email: string;
  employeeCode: string;
  employeeGrade?: string;
  designation: string;
  departmentSlug: string;
  managerEmail?: string;
  roles: string[];
};
type WorkflowTemplateSeed = {
  name: string;
  description: string;
  moduleName: string;
  eventName: string;
  entityType: string;
  status: WorkflowTemplateStatus;
  priority: number;
};

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  static readonly developmentPassword = 'Password123!';

  static readonly departmentSeeds: DepartmentSeed[] = [
    { name: 'Sales', slug: 'sales' },
    { name: 'Accounts', slug: 'accounts' },
    { name: 'Finance', slug: 'finance' },
    { name: 'HR', slug: 'hr' },
    { name: 'Payroll', slug: 'payroll' },
  ];

  static readonly roleSeeds: RoleSeed[] = [
    { name: 'Employee', slug: 'employee' },
    { name: 'Department Reviewer', slug: 'department-reviewer' },
    { name: 'Sales Officer', slug: 'sales-officer' },
    { name: 'Manager', slug: 'manager' },
    { name: 'Accounts Officer', slug: 'accounts-officer' },
    { name: 'Finance Admin', slug: 'finance-admin' },
    { name: 'HR Officer', slug: 'hr-officer' },
    { name: 'HR Manager', slug: 'hr-manager' },
    { name: 'CFO', slug: 'cfo' },
    { name: 'Payroll Officer', slug: 'payroll-officer' },
    { name: 'Admin', slug: 'admin' },
  ];

  static readonly permissionSeeds: PermissionSeed[] = [
    {
      name: 'Read profile',
      slug: 'auth.profile.read',
      resource: 'auth',
      action: 'read',
    },
    {
      name: 'Read users',
      slug: 'users.read',
      resource: 'users',
      action: 'read',
    },
    {
      name: 'Manage workflow builder',
      slug: 'workflow.builder.manage',
      resource: 'workflow-builder',
      action: 'manage',
    },
    {
      name: 'Read workflow runtime',
      slug: 'workflow.runtime.read',
      resource: 'workflow-runtime',
      action: 'read',
    },
    {
      name: 'Act on workflow runtime',
      slug: 'workflow.runtime.act',
      resource: 'workflow-runtime',
      action: 'act',
    },
    {
      name: 'Read expenses',
      slug: 'expenses.read',
      resource: 'expenses',
      action: 'read',
    },
    {
      name: 'Write expenses',
      slug: 'expenses.write',
      resource: 'expenses',
      action: 'write',
    },
    {
      name: 'Read leaves',
      slug: 'leaves.read',
      resource: 'leaves',
      action: 'read',
    },
    {
      name: 'Write leaves',
      slug: 'leaves.write',
      resource: 'leaves',
      action: 'write',
    },
    {
      name: 'Read payments',
      slug: 'payments.read',
      resource: 'payments',
      action: 'read',
    },
    {
      name: 'Write payments',
      slug: 'payments.write',
      resource: 'payments',
      action: 'write',
    },
    {
      name: 'Read billing requests',
      slug: 'billing.read',
      resource: 'billing',
      action: 'read',
    },
    {
      name: 'Write billing requests',
      slug: 'billing.write',
      resource: 'billing',
      action: 'write',
    },
    {
      name: 'Read invoices',
      slug: 'invoices.read',
      resource: 'invoices',
      action: 'read',
    },
    {
      name: 'Write invoices',
      slug: 'invoices.write',
      resource: 'invoices',
      action: 'write',
    },
    {
      name: 'Read dashboard',
      slug: 'dashboard.read',
      resource: 'dashboard',
      action: 'read',
    },
    {
      name: 'Read audit logs',
      slug: 'audit.read',
      resource: 'audit',
      action: 'read',
    },
  ];

  static readonly rolePermissionSeeds: RolePermissionSeed[] = [
    {
      roleSlug: 'employee',
      permissionSlugs: [
        'auth.profile.read',
        'expenses.read',
        'expenses.write',
        'leaves.read',
        'leaves.write',
        'billing.read',
        'billing.write',
        'invoices.read',
        'payments.read',
        'audit.read',
        'dashboard.read',
        'workflow.runtime.read',
        'workflow.runtime.act',
      ],
    },
    {
      roleSlug: 'sales-officer',
      permissionSlugs: [
        'auth.profile.read',
        'expenses.read',
        'leaves.read',
        'billing.read',
        'billing.write',
        'dashboard.read',
        'workflow.runtime.read',
        'workflow.runtime.act',
        'audit.read',
      ],
    },
    {
      roleSlug: 'manager',
      permissionSlugs: [
        'auth.profile.read',
        'users.read',
        'expenses.read',
        'leaves.read',
        'billing.read',
        'invoices.read',
        'dashboard.read',
        'workflow.runtime.read',
        'workflow.runtime.act',
        'audit.read',
      ],
    },
    {
      roleSlug: 'department-reviewer',
      permissionSlugs: [
        'auth.profile.read',
        'expenses.read',
        'leaves.read',
        'billing.read',
        'dashboard.read',
        'workflow.runtime.read',
        'workflow.runtime.act',
        'audit.read',
      ],
    },
    {
      roleSlug: 'accounts-officer',
      permissionSlugs: [
        'auth.profile.read',
        'expenses.read',
        'leaves.read',
        'payments.read',
        'payments.write',
        'billing.read',
        'invoices.read',
        'dashboard.read',
        'workflow.runtime.read',
        'workflow.runtime.act',
        'audit.read',
      ],
    },
    {
      roleSlug: 'finance-admin',
      permissionSlugs: [
        'auth.profile.read',
        'users.read',
        'expenses.read',
        'leaves.read',
        'payments.read',
        'payments.write',
        'billing.read',
        'invoices.read',
        'invoices.write',
        'dashboard.read',
        'workflow.runtime.read',
        'workflow.runtime.act',
        'audit.read',
      ],
    },
    {
      roleSlug: 'hr-officer',
      permissionSlugs: [
        'auth.profile.read',
        'expenses.read',
        'leaves.read',
        'billing.read',
        'dashboard.read',
        'workflow.runtime.read',
        'workflow.runtime.act',
        'audit.read',
      ],
    },
    {
      roleSlug: 'hr-manager',
      permissionSlugs: [
        'auth.profile.read',
        'users.read',
        'expenses.read',
        'leaves.read',
        'billing.read',
        'dashboard.read',
        'workflow.runtime.read',
        'workflow.runtime.act',
        'audit.read',
      ],
    },
    {
      roleSlug: 'cfo',
      permissionSlugs: [
        'auth.profile.read',
        'expenses.read',
        'leaves.read',
        'billing.read',
        'payments.read',
        'payments.write',
        'dashboard.read',
        'workflow.runtime.read',
        'workflow.runtime.act',
        'audit.read',
      ],
    },
    {
      roleSlug: 'payroll-officer',
      permissionSlugs: [
        'auth.profile.read',
        'expenses.read',
        'leaves.read',
        'billing.read',
        'payments.read',
        'payments.write',
        'dashboard.read',
        'workflow.runtime.read',
        'workflow.runtime.act',
        'audit.read',
      ],
    }, //
  ];

  static readonly userSeeds: UserSeed[] = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      employeeCode: 'EMP-ADMIN',
      employeeGrade: 'G8',
      designation: 'System Administrator',
      departmentSlug: 'finance',
      managerEmail: 'manager@example.com',
      roles: ['admin'],
    },
    {
      name: 'Employee User',
      email: 'employee@example.com',
      employeeCode: 'EMP-001',
      employeeGrade: 'G5',
      designation: 'Sales Executive',
      departmentSlug: 'sales',
      managerEmail: 'manager@example.com',
      roles: ['employee'],
    },
    {
      name: 'Manager User',
      email: 'manager@example.com',
      employeeCode: 'EMP-002',
      employeeGrade: 'G7',
      designation: 'Sales Manager',
      departmentSlug: 'sales',
      roles: ['employee', 'manager', 'department-reviewer'],
    },
    {
      name: 'Accounts Officer',
      email: 'accounts@example.com',
      employeeCode: 'EMP-003',
      employeeGrade: 'G4',
      designation: 'Accounts Officer',
      departmentSlug: 'accounts',
      managerEmail: 'manager@example.com',
      roles: ['employee', 'accounts-officer'],
    },
    {
      name: 'Finance Admin',
      email: 'finance@example.com',
      employeeCode: 'EMP-004',
      employeeGrade: 'G6',
      designation: 'Finance Admin',
      departmentSlug: 'finance',
      managerEmail: 'manager@example.com',
      roles: ['employee', 'finance-admin'],
    },
    {
      name: 'HR Officer',
      email: 'hr.officer@example.com',
      employeeCode: 'EMP-005',
      employeeGrade: 'G4',
      designation: 'HR Officer',
      departmentSlug: 'hr',
      managerEmail: 'manager@example.com',
      roles: ['employee', 'hr-officer'],
    },
    {
      name: 'HR Manager',
      email: 'hr.manager@example.com',
      employeeCode: 'EMP-006',
      employeeGrade: 'G7',
      designation: 'HR Manager',
      departmentSlug: 'hr',
      managerEmail: 'manager@example.com',
      roles: ['employee', 'hr-manager'],
    },
    {
      name: 'CFO User',
      email: 'cfo@example.com',
      employeeCode: 'EMP-007',
      employeeGrade: 'G9',
      designation: 'Chief Financial Officer',
      departmentSlug: 'finance',
      managerEmail: 'manager@example.com',
      roles: ['employee', 'cfo'],
    },
    {
      name: 'Payroll Officer',
      email: 'payroll@example.com',
      employeeCode: 'EMP-008',
      employeeGrade: 'G4',
      designation: 'Payroll Officer',
      departmentSlug: 'payroll',
      managerEmail: 'manager@example.com',
      roles: ['employee', 'payroll-officer'],
    },
  ];

  static readonly workflowTemplateSeeds: WorkflowTemplateSeed[] = [
    {
      name: 'Billing Approval Workflow',
      description: 'Routes submitted billing requests over 2500 BDT.',
      moduleName: 'billing',
      eventName: 'billing.submitted',
      entityType: 'BillingRequest',
      status: WorkflowTemplateStatus.PUBLISHED,
      priority: 1,
    },
    {
      name: 'Expense Approval Workflow',
      description: 'Routes submitted expense requests over 2000 BDT.',
      moduleName: 'expenses',
      eventName: 'expense.submitted',
      entityType: 'Expense',
      status: WorkflowTemplateStatus.PUBLISHED,
      priority: 1,
    },
    {
      name: 'Leave Approval Workflow',
      description: 'Routes submitted leave requests over 2 days.',
      moduleName: 'leaves',
      eventName: 'leave.submitted',
      entityType: 'LeaveRequest',
      status: WorkflowTemplateStatus.PUBLISHED,
      priority: 1,
    },
  ];

  constructor(
    @InjectRepository(Department)
    private readonly departmentsRepository: Repository<Department>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepository: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private readonly userRolesRepository: Repository<UserRole>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(WorkflowTemplate)
    private readonly workflowTemplatesRepository: Repository<WorkflowTemplate>,
    @InjectRepository(WorkflowEventSchema)
    private readonly workflowEventSchemasRepository: Repository<WorkflowEventSchema>,
    @InjectRepository(WorkflowTriggerCondition)
    private readonly workflowTriggerConditionsRepository: Repository<WorkflowTriggerCondition>,
    @InjectRepository(WorkflowApprovalRule)
    private readonly workflowApprovalRulesRepository: Repository<WorkflowApprovalRule>,
    @InjectRepository(WorkflowApprovalStepConfig)
    private readonly workflowApprovalStepConfigsRepository: Repository<WorkflowApprovalStepConfig>,
    @InjectRepository(WorkflowOutcomeConfig)
    private readonly workflowOutcomeConfigsRepository: Repository<WorkflowOutcomeConfig>,
    @InjectRepository(BillingRequest)
    private readonly billingRequestsRepository: Repository<BillingRequest>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(LeaveRequest)
    private readonly leavesRepository: Repository<LeaveRequest>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') return;

    await this.seedDepartments();
    await this.seedRolesAndPermissions();
    await this.seedUsers();
    await this.seedWorkflowDefinitions();
    await this.seedDemoRecords();
  }

  private async seedDepartments(): Promise<Map<string, Department>> {
    const departments = new Map<string, Department>();
    for (const seed of SeedService.departmentSeeds) {
      let department = await this.departmentsRepository.findOneBy({
        slug: seed.slug,
      });
      if (!department) {
        department = await this.departmentsRepository.save(
          this.departmentsRepository.create(seed),
        );
      }
      departments.set(seed.slug, department);
    }
    return departments;
  }

  private async seedRolesAndPermissions(): Promise<void> {
    const roleEntries = await Promise.all(
      SeedService.roleSeeds.map(async (seed) => {
        let role = await this.rolesRepository.findOneBy({ slug: seed.slug });
        if (!role) {
          role = await this.rolesRepository.save(
            this.rolesRepository.create({
              ...seed,
              description: seed.description ?? null,
              isSystem: true,
            }),
          );
        }
        return [seed.slug, role] as const;
      }),
    );
    const roles = new Map<string, Role>(roleEntries);

    const permissionEntries = await Promise.all(
      SeedService.permissionSeeds.map(async (seed) => {
        let permission = await this.permissionsRepository.findOneBy({
          slug: seed.slug,
        });
        if (!permission) {
          permission = await this.permissionsRepository.save(
            this.permissionsRepository.create({ ...seed, description: null }),
          );
        }
        return [seed.slug, permission] as const;
      }),
    );
    const permissions = new Map<string, Permission>(permissionEntries);

    const admin = roles.get('admin');
    await Promise.all([
      ...(admin
        ? [...permissions.values()].map((permission) =>
            this.ensureRolePermission(admin.id, permission.id),
          )
        : []),
      ...SeedService.rolePermissionSeeds.map(({ roleSlug, permissionSlugs }) =>
        this.assignPermissions(roleSlug, permissionSlugs, roles, permissions),
      ),
    ]);
  }

  private async seedUsers(): Promise<void> {
    const departments = await this.seedDepartments();
    const roles = await this.rolesRepository.find();
    const rolesBySlug = new Map(roles.map((role) => [role.slug, role]));
    const passwordHash = await bcrypt.hash(SeedService.developmentPassword, 10);

    const userEntries = await Promise.all(
      SeedService.userSeeds.map(async (seed) => {
        const department = departments.get(seed.departmentSlug) ?? null;
        let user = await this.usersRepository.findOneBy({ email: seed.email });
        if (!user) {
          user = await this.usersRepository.save(
            this.usersRepository.create({
              name: seed.name,
              email: seed.email,
              passwordHash,
              employeeCode: seed.employeeCode,
              employeeGrade: seed.employeeGrade ?? null,
              designation: seed.designation,
              departmentId: department?.id ?? null,
              managerId: null,
              isActive: true,
            }),
          );
        }

        const seedRoleIds = seed.roles.flatMap((roleSlug) => {
          const role = rolesBySlug.get(roleSlug);
          return role ? [role.id] : [];
        });

        await this.reconcileSeedUserRoles(user.id, seedRoleIds);
        await Promise.all(
          seedRoleIds.map((roleId) => this.ensureUserRole(user.id, roleId)),
        );

        return [seed.email, user] as const;
      }),
    );
    const usersByEmail = new Map<string, User>(userEntries);

    await Promise.all(
      SeedService.userSeeds.flatMap((seed) => {
        if (!seed.managerEmail) return [];
        const user = usersByEmail.get(seed.email);
        const manager = usersByEmail.get(seed.managerEmail);
        if (!user || !manager || user.managerId === manager.id) return [];
        user.managerId = manager.id;
        return [this.usersRepository.save(user)];
      }),
    );

    const sales = departments.get('sales');
    const manager = await this.usersRepository.findOneBy({
      email: 'manager@example.com',
    });
    if (sales && manager && sales.headUserId !== manager.id) {
      sales.headUserId = manager.id;
      await this.departmentsRepository.save(sales);
    }
  }

  private async seedWorkflowDefinitions(): Promise<void> {
    await this.seedEventSchemas();
    const effectiveFrom = new Date();
    effectiveFrom.setHours(0, 0, 0, 0);
    const effectiveTo = new Date('2028-12-31T23:59:59.000Z');

    for (const seed of SeedService.workflowTemplateSeeds) {
      let template = await this.workflowTemplatesRepository.findOneBy({
        name: seed.name,
      });
      if (!template) {
        template = await this.workflowTemplatesRepository.save(
          this.workflowTemplatesRepository.create({
            ...seed,
            effectiveFrom,
            effectiveTo,
            allowResubmission: true,
            createdById: null,
          }),
        );
      } else {
        template = await this.workflowTemplatesRepository.save({
          ...template,
          ...seed,
          effectiveFrom,
          effectiveTo,
          allowResubmission: true,
        });
      }

      if (seed.entityType === 'Expense') {
        await this.seedExpenseWorkflow(template);
      } else if (seed.entityType === 'LeaveRequest') {
        await this.seedLeaveWorkflow(template);
      } else if (seed.entityType === 'BillingRequest') {
        await this.seedBillingWorkflow(template);
      }
    }
  }

  private async seedEventSchemas(): Promise<void> {
    const schemas = [
      {
        moduleName: 'expenses',
        eventName: 'expense.submitted',
        entityType: 'Expense',
        fields: [
          'amount',
          'currency',
          'category',
          'vendor',
          'itemValue',
          'price',
          'quantity',
          'departmentId',
          'customFields.budgetOwnerId',
        ],
      },
      {
        moduleName: 'billing',
        eventName: 'billing.submitted',
        entityType: 'BillingRequest',
        fields: [
          'amount',
          'currency',
          'billingCategory',
          'customerName',
          'departmentId',
          'customFields.projectCode',
          'customFields.accountOwnerId',
        ],
      },
      {
        moduleName: 'leaves',
        eventName: 'leave.submitted',
        entityType: 'LeaveRequest',
        fields: [
          'leaveType',
          'leaveDays',
          'startDate',
          'endDate',
          'employeeGrade',
          'departmentId',
        ],
      },
    ];

    for (const schema of schemas) {
      const exists = await this.workflowEventSchemasRepository.findOneBy({
        moduleName: schema.moduleName,
        eventName: schema.eventName,
        entityType: schema.entityType,
      });
      if (exists) continue;
      const operators: ConditionOperator[] = [
        'eq',
        'neq',
        'gt',
        'gte',
        'lt',
        'lte',
        'between',
        'in',
        'not_in',
        'contains',
        'is_empty',
        'is_not_empty',
      ];
      await this.workflowEventSchemasRepository.save(
        this.workflowEventSchemasRepository.create({
          moduleName: schema.moduleName,
          eventName: schema.eventName,
          entityType: schema.entityType,
          fieldSchemaJson: {
            fields: schema.fields.map((field) => ({
              key: field,
              type:
                field.includes('amount') ||
                field.includes('price') ||
                field.includes('quantity') ||
                field === 'leaveDays'
                  ? 'number'
                  : field.includes('UserId')
                    ? 'user'
                    : 'string',
              operators,
            })),
          },
          outcomeActionsJson: {},
          assigneeResolversJson: {},
          isActive: true,
        }),
      );
    }
  }

  private async seedExpenseWorkflow(template: WorkflowTemplate): Promise<void> {
    await this.ensureTriggerCondition(template.id, {
      mode: 'all',
      conditions: [],
    });
    await this.ensureOutcomeConfig(template.id, {
      approvedActionsJson: { createPaymentRequest: true },
      rejectedActionsJson: { expenseStatus: ExpenseStatus.REJECTED },
    });
    const cfo = await this.usersRepository.findOneBy({
      email: 'cfo@example.com',
    });
    const rule = await this.ensureRule(template.id, {
      name: 'Expense rule over 2000 BDT',
      priority: 1,
      isFallback: false,
      conditionJson: {
        mode: 'all',
        conditions: [{ field: 'amount', operator: 'gte', value: 2000 }],
      },
    });
    await this.ensureStep(rule.id, {
      stepOrder: 1,
      stepName: 'Requester manager approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.REQUESTER_MANAGER,
    });
    await this.ensureStep(rule.id, {
      stepOrder: 2,
      stepName: 'Accounts officer approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.ROLE,
      assigneeRoleSlug: 'accounts-officer',
    });
    await this.ensureStep(rule.id, {
      stepOrder: 3,
      stepName: 'CFO approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.USER,
      assigneeUserId: cfo?.id ?? null,
    });
  }

  private async seedLeaveWorkflow(template: WorkflowTemplate): Promise<void> {
    await this.ensureTriggerCondition(template.id, {
      mode: 'all',
      conditions: [],
    });
    await this.ensureOutcomeConfig(template.id, {
      approvedActionsJson: { leaveStatus: LeaveRequestStatus.APPROVED },
      rejectedActionsJson: { leaveStatus: LeaveRequestStatus.REJECTED },
    });
    const hrManager = await this.usersRepository.findOneBy({
      email: 'hr.manager@example.com',
    });
    const rule = await this.ensureRule(template.id, {
      name: 'Leave rule over 2 days',
      priority: 1,
      isFallback: false,
      conditionJson: {
        mode: 'all',
        conditions: [{ field: 'leaveDays', operator: 'gte', value: 3 }],
      },
    });
    await this.ensureStep(rule.id, {
      stepOrder: 1,
      stepName: 'Requester manager approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.REQUESTER_MANAGER,
    });
    await this.ensureStep(rule.id, {
      stepOrder: 2,
      stepName: 'HR officer approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.ROLE,
      assigneeRoleSlug: 'hr-officer',
    });
    await this.ensureStep(rule.id, {
      stepOrder: 3,
      stepName: 'HR manager approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.USER,
      assigneeUserId: hrManager?.id ?? null,
    });
  }

  private async seedBillingWorkflow(template: WorkflowTemplate): Promise<void> {
    await this.ensureTriggerCondition(template.id, {
      mode: 'all',
      conditions: [],
    });
    await this.ensureOutcomeConfig(template.id, {
      approvedActionsJson: {
        actions: [
          { type: 'MARK_BILLING_APPROVED' },
          { type: 'CREATE_INVOICE' },
        ],
      },
      rejectedActionsJson: {
        actions: [{ type: 'MARK_BILLING_REJECTED' }],
      },
    });
    const cfo = await this.usersRepository.findOneBy({
      email: 'cfo@example.com',
    });
    const rule = await this.ensureRule(template.id, {
      name: 'Invoice bill over 2500 BDT',
      priority: 1,
      isFallback: false,
      conditionJson: {
        mode: 'all',
        conditions: [{ field: 'amount', operator: 'gte', value: 2500 }],
      },
    });
    await this.ensureStep(rule.id, {
      stepOrder: 1,
      stepName: 'Requester manager approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.REQUESTER_MANAGER,
    });
    await this.ensureStep(rule.id, {
      stepOrder: 2,
      stepName: 'Accounts officer approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.ROLE,
      assigneeRoleSlug: 'accounts-officer',
    });
    await this.ensureStep(rule.id, {
      stepOrder: 3,
      stepName: 'CFO approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.USER,
      assigneeUserId: cfo?.id ?? null,
    });
  }

  private async seedDemoRecords(): Promise<void> {
    const employee = await this.usersRepository.findOneBy({
      email: 'employee@example.com',
    });
    const sales = await this.departmentsRepository.findOneBy({ slug: 'sales' });
    if (!employee) return;

    await this.ensureSeedExpenseRequest(employee, sales);
    await this.ensureSeedLeaveRequest(employee, sales);
    await this.ensureSeedBillingRequest(employee, sales);
  }

  private async ensureSeedExpenseRequest(
    employee: User,
    sales: Department | null,
  ): Promise<void> {
    const title = 'Seed expense request over 2000 BDT';
    const exists = await this.expensesRepository.findOneBy({
      requesterId: employee.id,
      title,
    });
    if (exists) return;

    await this.expensesRepository.save(
      this.expensesRepository.create({
        requesterId: employee.id,
        createdById: employee.id,
        departmentId: sales?.id ?? null,
        title,
        description: 'Seeded expense request for the published workflow.',
        amount: '2500',
        currency: 'BDT',
        category: 'travel',
        vendor: 'Seed Vendor',
        itemValue: '2500',
        price: '2500',
        quantity: '1',
        status: ExpenseStatus.DRAFT,
        workflowInstanceId: null,
        rejectionReason: null,
        customFieldsJson: {},
        submittedAt: null,
        approvedAt: null,
        rejectedAt: null,
        paidAt: null,
      }),
    );
  }

  private async ensureSeedLeaveRequest(
    employee: User,
    sales: Department | null,
  ): Promise<void> {
    const exists = await this.leavesRepository.findOneBy({
      requesterId: employee.id,
      leaveType: 'ANNUAL',
      startDate: '2026-06-16',
    });
    if (exists) return;

    await this.leavesRepository.save(
      this.leavesRepository.create({
        requesterId: employee.id,
        createdById: employee.id,
        departmentId: sales?.id ?? null,
        leaveType: 'ANNUAL',
        leaveDays: 3,
        startDate: '2026-06-16',
        endDate: '2026-06-18',
        reason: 'Seeded leave request for the published workflow.',
        employeeGrade: 'G5',
        status: LeaveRequestStatus.DRAFT,
        workflowInstanceId: null,
        rejectionReason: null,
        approvedPeriodJson: null,
        customFieldsJson: {},
        submittedAt: null,
        approvedAt: null,
        rejectedAt: null,
      }),
    );
  }

  private async ensureSeedBillingRequest(
    employee: User,
    sales: Department | null,
  ): Promise<void> {
    const title = 'Seed billing request over 2500 BDT';
    const exists = await this.billingRequestsRepository.findOneBy({
      requesterId: employee.id,
      title,
    });
    if (exists) return;

    await this.billingRequestsRepository.save(
      this.billingRequestsRepository.create({
        requesterId: employee.id,
        departmentId: sales?.id ?? null,
        customerName: 'Seed Customer Ltd.',
        customerEmail: 'billing.seed@example.com',
        customerAddress: 'Dhaka, Bangladesh',
        title,
        description: 'Seeded billing request for the published workflow.',
        amount: '3000',
        currency: 'BDT',
        billingCategory: 'Installation',
        status: BillingRequestStatus.DRAFT,
        workflowInstanceId: null,
        invoiceId: null,
        rejectionReason: null,
        customFieldsJson: { projectCode: 'SEED-2026-001' },
        submittedAt: null,
        approvedAt: null,
        rejectedAt: null,
      }),
    );
  }

  private async ensureTriggerCondition(
    workflowTemplateId: string,
    conditionJson: WorkflowTriggerCondition['conditionJson'],
  ): Promise<void> {
    const exists = await this.workflowTriggerConditionsRepository.findOneBy({
      workflowTemplateId,
    });
    if (!exists) {
      await this.workflowTriggerConditionsRepository.save(
        this.workflowTriggerConditionsRepository.create({
          workflowTemplateId,
          conditionJson,
        }),
      );
      return;
    }

    await this.workflowTriggerConditionsRepository.save({
      ...exists,
      conditionJson,
    });
  }

  private async ensureOutcomeConfig(
    workflowTemplateId: string,
    values: Pick<
      WorkflowOutcomeConfig,
      'approvedActionsJson' | 'rejectedActionsJson'
    >,
  ): Promise<void> {
    const exists = await this.workflowOutcomeConfigsRepository.findOneBy({
      workflowTemplateId,
    });
    if (!exists) {
      await this.workflowOutcomeConfigsRepository.save(
        this.workflowOutcomeConfigsRepository.create({
          workflowTemplateId,
          ...values,
        }),
      );
      return;
    }

    await this.workflowOutcomeConfigsRepository.save({
      ...exists,
      ...values,
    });
  }

  private async ensureRule(
    workflowTemplateId: string,
    values: Pick<
      WorkflowApprovalRule,
      'name' | 'priority' | 'isFallback' | 'conditionJson'
    >,
  ): Promise<WorkflowApprovalRule> {
    let rule = await this.workflowApprovalRulesRepository.findOneBy({
      workflowTemplateId,
      name: values.name,
    });
    if (!rule) {
      rule = await this.workflowApprovalRulesRepository.save(
        this.workflowApprovalRulesRepository.create({
          workflowTemplateId,
          ...values,
          isActive: true,
        }),
      );
      return rule;
    }

    rule = await this.workflowApprovalRulesRepository.save({
      ...rule,
      ...values,
      isActive: true,
    });
    return rule;
  }

  private async ensureStep(
    workflowApprovalRuleId: string,
    values: Pick<
      WorkflowApprovalStepConfig,
      'stepOrder' | 'stepName' | 'stepType' | 'assigneeType'
    > & {
      assigneeRoleSlug?: string | null;
      assigneeUserId?: string | null;
    },
  ): Promise<void> {
    const exists = await this.workflowApprovalStepConfigsRepository.findOneBy({
      workflowApprovalRuleId,
      stepOrder: values.stepOrder,
    });
    const stepValues = {
      workflowApprovalRuleId,
      stepOrder: values.stepOrder,
      stepName: values.stepName,
      stepType: values.stepType,
      assigneeType: values.assigneeType,
      assigneeRoleSlug: values.assigneeRoleSlug ?? null,
      assigneeUserId: values.assigneeUserId ?? null,
      assigneeFieldPath: null,
      isRequired: true,
      requiresComment: false,
      canReject: true,
      canReassign: false,
    };

    await this.workflowApprovalStepConfigsRepository.save(
      exists
        ? { ...exists, ...stepValues }
        : this.workflowApprovalStepConfigsRepository.create(stepValues),
    );
  }

  private async assignPermissions(
    roleSlug: string,
    permissionSlugs: string[],
    roles: Map<string, Role>,
    permissions: Map<string, Permission>,
  ): Promise<void> {
    const role = roles.get(roleSlug);
    if (!role) return;
    await Promise.all(
      permissionSlugs.flatMap((permissionSlug) => {
        const permission = permissions.get(permissionSlug);
        return permission
          ? [this.ensureRolePermission(role.id, permission.id)]
          : [];
      }),
    );
  }

  private async ensureRolePermission(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    const exists = await this.rolePermissionsRepository.findOneBy({
      roleId,
      permissionId,
    });
    if (!exists) {
      await this.rolePermissionsRepository.save(
        this.rolePermissionsRepository.create({ roleId, permissionId }),
      );
    }
  }

  private async ensureUserRole(userId: string, roleId: string): Promise<void> {
    const exists = await this.userRolesRepository.findOneBy({ userId, roleId });
    if (!exists) {
      await this.userRolesRepository.save(
        this.userRolesRepository.create({ userId, roleId }),
      );
    }
  }

  private async reconcileSeedUserRoles(
    userId: string,
    seedRoleIds: string[],
  ): Promise<void> {
    const seedRoleIdSet = new Set(seedRoleIds);
    const existingUserRoles = await this.userRolesRepository.find({
      where: { userId },
    });

    await Promise.all(
      existingUserRoles.flatMap((userRole) =>
        seedRoleIdSet.has(userRole.roleId)
          ? []
          : [this.userRolesRepository.delete({ id: userRole.id })],
      ),
    );
  }
}
