import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { Department } from '../departments/entities/department.entity';
import { Expense, ExpenseStatus } from '../expenses/entities/expense.entity';
import {
  LeaveRequest,
  LeaveRequestStatus,
} from '../leaves/entities/leave-request.entity';
import {
  Notification,
  NotificationType,
} from '../notifications/entities/notification.entity';
import {
  PaymentRequest,
  PaymentRequestStatus,
} from '../payments/entities/payment-request.entity';
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
import { WorkflowAction } from '../workflow-runtime/entities/workflow-action.entity';
import { WorkflowInstance } from '../workflow-runtime/entities/workflow-instance.entity';
import { WorkflowStep } from '../workflow-runtime/entities/workflow-step.entity';
import {
  WorkflowActionType,
  WorkflowInstanceStatus,
  WorkflowStepStatus,
} from '../workflow-runtime/enums/workflow-runtime.enums';

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
        'dashboard.read',
        'workflow.runtime.act',
      ],
    },
    {
      roleSlug: 'manager',
      permissionSlugs: [
        'auth.profile.read',
        'users.read',
        'expenses.read',
        'leaves.read',
        'dashboard.read',
        'workflow.runtime.act',
      ],
    },
    {
      roleSlug: 'department-reviewer',
      permissionSlugs: [
        'auth.profile.read',
        'expenses.read',
        'leaves.read',
        'dashboard.read',
        'workflow.runtime.act',
      ],
    },
    {
      roleSlug: 'accounts-officer',
      permissionSlugs: [
        'auth.profile.read',
        'expenses.read',
        'payments.read',
        'payments.write',
        'dashboard.read',
        'workflow.runtime.act',
      ],
    },
    {
      roleSlug: 'finance-admin',
      permissionSlugs: [
        'auth.profile.read',
        'users.read',
        'expenses.read',
        'payments.read',
        'dashboard.read',
        'workflow.runtime.act',
      ],
    },
    {
      roleSlug: 'hr-officer',
      permissionSlugs: [
        'auth.profile.read',
        'leaves.read',
        'dashboard.read',
        'workflow.runtime.act',
      ],
    },
    {
      roleSlug: 'hr-manager',
      permissionSlugs: [
        'auth.profile.read',
        'users.read',
        'leaves.read',
        'dashboard.read',
        'workflow.runtime.act',
      ],
    },
    {
      roleSlug: 'cfo',
      permissionSlugs: [
        'auth.profile.read',
        'expenses.read',
        'payments.read',
        'dashboard.read',
        'workflow.runtime.act',
      ],
    },
    {
      roleSlug: 'payroll-officer',
      permissionSlugs: [
        'auth.profile.read',
        'payments.read',
        'payments.write',
        'dashboard.read',
        'workflow.runtime.act',
      ],
    },
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
      roles: ['manager', 'department-reviewer'],
    },
    {
      name: 'Accounts Officer',
      email: 'accounts@example.com',
      employeeCode: 'EMP-003',
      employeeGrade: 'G4',
      designation: 'Accounts Officer',
      departmentSlug: 'accounts',
      managerEmail: 'manager@example.com',
      roles: ['accounts-officer'],
    },
    {
      name: 'Finance Admin',
      email: 'finance@example.com',
      employeeCode: 'EMP-004',
      employeeGrade: 'G6',
      designation: 'Finance Admin',
      departmentSlug: 'finance',
      managerEmail: 'manager@example.com',
      roles: ['finance-admin'],
    },
    {
      name: 'HR Officer',
      email: 'hr.officer@example.com',
      employeeCode: 'EMP-005',
      employeeGrade: 'G4',
      designation: 'HR Officer',
      departmentSlug: 'hr',
      managerEmail: 'manager@example.com',
      roles: ['hr-officer'],
    },
    {
      name: 'HR Manager',
      email: 'hr.manager@example.com',
      employeeCode: 'EMP-006',
      employeeGrade: 'G7',
      designation: 'HR Manager',
      departmentSlug: 'hr',
      managerEmail: 'manager@example.com',
      roles: ['hr-manager'],
    },
    {
      name: 'CFO User',
      email: 'cfo@example.com',
      employeeCode: 'EMP-007',
      employeeGrade: 'G9',
      designation: 'Chief Financial Officer',
      departmentSlug: 'finance',
      managerEmail: 'manager@example.com',
      roles: ['cfo'],
    },
    {
      name: 'Payroll Officer',
      email: 'payroll@example.com',
      employeeCode: 'EMP-008',
      employeeGrade: 'G4',
      designation: 'Payroll Officer',
      departmentSlug: 'payroll',
      managerEmail: 'manager@example.com',
      roles: ['payroll-officer'],
    },
  ];

  static readonly workflowTemplateSeeds: WorkflowTemplateSeed[] = [
    {
      name: 'Expense Approval Workflow',
      moduleName: 'expenses',
      eventName: 'expense.submitted',
      entityType: 'Expense',
      status: WorkflowTemplateStatus.PUBLISHED,
      priority: 100,
    },
    {
      name: 'Leave Approval Workflow',
      moduleName: 'leaves',
      eventName: 'leave.submitted',
      entityType: 'LeaveRequest',
      status: WorkflowTemplateStatus.PUBLISHED,
      priority: 90,
    },
    {
      name: 'Attendance Adjustment Workflow',
      moduleName: 'attendance',
      eventName: 'attendance.adjustment_submitted',
      entityType: 'AttendanceAdjustment',
      status: WorkflowTemplateStatus.DRAFT,
      priority: 10,
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
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(LeaveRequest)
    private readonly leavesRepository: Repository<LeaveRequest>,
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestsRepository: Repository<PaymentRequest>,
    @InjectRepository(AuditLog)
    private readonly auditLogsRepository: Repository<AuditLog>,
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(WorkflowInstance)
    private readonly workflowInstancesRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private readonly workflowStepsRepository: Repository<WorkflowStep>,
    @InjectRepository(WorkflowAction)
    private readonly workflowActionsRepository: Repository<WorkflowAction>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') return;

    await this.seedDepartments();
    await this.seedRolesAndPermissions();
    await this.seedUsers(); //
    // Workflow definition seeds are paused until we need them again.
    // await this.seedWorkflowDefinitions();
    // Demo transaction seeds are paused so development starts from scratch.
    // await this.seedDemoRecords();
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

        await Promise.all(
          seed.roles.flatMap((roleSlug) => {
            const role = rolesBySlug.get(roleSlug);
            return role ? [this.ensureUserRole(user.id, role.id)] : [];
          }),
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
    for (const seed of SeedService.workflowTemplateSeeds) {
      let template = await this.workflowTemplatesRepository.findOneBy({
        name: seed.name,
      });
      if (!template) {
        template = await this.workflowTemplatesRepository.save(
          this.workflowTemplatesRepository.create({
            ...seed,
            description: `${seed.name} seeded for development`,
            allowResubmission: true,
            createdById: null,
          }),
        );
      }

      if (seed.entityType === 'Expense') {
        await this.seedExpenseWorkflow(template);
      } else if (seed.entityType === 'LeaveRequest') {
        await this.seedLeaveWorkflow(template);
      } else if (seed.entityType === 'AttendanceAdjustment') {
        await this.seedAttendanceWorkflow(template);
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
      {
        moduleName: 'attendance',
        eventName: 'attendance.adjustment_submitted',
        entityType: 'AttendanceAdjustment',
        fields: ['adjustmentType', 'employeeGrade', 'departmentId'],
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
      conditions: [{ field: 'amount', operator: 'gte', value: 1 }],
    });
    await this.ensureOutcomeConfig(template.id, {
      approvedActionsJson: { expenseStatus: ExpenseStatus.PAYMENT_PENDING },
      rejectedActionsJson: { expenseStatus: ExpenseStatus.REJECTED },
    });
    const highValueRule = await this.ensureRule(template.id, {
      name: 'High value expense',
      priority: 10,
      isFallback: false,
      conditionJson: {
        mode: 'all',
        conditions: [{ field: 'amount', operator: 'gte', value: 5000 }],
      },
    });
    await this.ensureStep(highValueRule.id, {
      stepOrder: 1,
      stepName: 'Department review',
      stepType: WorkflowStepType.REVIEW,
      assigneeType: WorkflowAssigneeType.ROLE,
      assigneeRoleSlug: 'department-reviewer',
    });
    await this.ensureStep(highValueRule.id, {
      stepOrder: 2,
      stepName: 'Finance approval',
      stepType: WorkflowStepType.FINANCE_CHECK,
      assigneeType: WorkflowAssigneeType.ROLE,
      assigneeRoleSlug: 'finance-admin',
    });

    const fallbackRule = await this.ensureRule(template.id, {
      name: 'Standard expense',
      priority: 0,
      isFallback: true,
      conditionJson: null,
    });
    await this.ensureStep(fallbackRule.id, {
      stepOrder: 1,
      stepName: 'Department review',
      stepType: WorkflowStepType.REVIEW,
      assigneeType: WorkflowAssigneeType.ROLE,
      assigneeRoleSlug: 'department-reviewer',
    });
  }

  private async seedLeaveWorkflow(template: WorkflowTemplate): Promise<void> {
    await this.ensureTriggerCondition(template.id, {
      mode: 'all',
      conditions: [{ field: 'leaveDays', operator: 'gte', value: 1 }],
    });
    await this.ensureOutcomeConfig(template.id, {
      approvedActionsJson: { leaveStatus: LeaveRequestStatus.APPROVED },
      rejectedActionsJson: { leaveStatus: LeaveRequestStatus.REJECTED },
    });
    const rule = await this.ensureRule(template.id, {
      name: 'Leave approval',
      priority: 10,
      isFallback: true,
      conditionJson: null,
    });
    await this.ensureStep(rule.id, {
      stepOrder: 1,
      stepName: 'Manager approval',
      stepType: WorkflowStepType.MANAGEMENT_APPROVAL,
      assigneeType: WorkflowAssigneeType.REQUESTER_MANAGER,
    });
    await this.ensureStep(rule.id, {
      stepOrder: 2,
      stepName: 'HR approval',
      stepType: WorkflowStepType.HR_CHECK,
      assigneeType: WorkflowAssigneeType.ROLE,
      assigneeRoleSlug: 'hr-manager',
    });
  }

  private async seedAttendanceWorkflow(
    template: WorkflowTemplate,
  ): Promise<void> {
    await this.ensureTriggerCondition(template.id, {
      mode: 'all',
      conditions: [{ field: 'adjustmentType', operator: 'is_not_empty' }],
    });
    const rule = await this.ensureRule(template.id, {
      name: 'Attendance adjustment',
      priority: 0,
      isFallback: true,
      conditionJson: null,
    });
    await this.ensureStep(rule.id, {
      stepOrder: 1,
      stepName: 'HR officer review',
      stepType: WorkflowStepType.HR_CHECK,
      assigneeType: WorkflowAssigneeType.ROLE,
      assigneeRoleSlug: 'hr-officer',
    });
  }

  private async seedDemoRecords(): Promise<void> {
    const employee = await this.usersRepository.findOneBy({
      email: 'employee@example.com',
    });
    const sales = await this.departmentsRepository.findOneBy({ slug: 'sales' });
    if (!employee) return;

    if ((await this.expensesRepository.count()) === 0) {
      await this.expensesRepository.save(
        this.expensesRepository.create({
          requesterId: employee.id,
          createdById: employee.id,
          departmentId: sales?.id ?? null,
          title: 'Demo travel reimbursement',
          description: 'Seeded development expense',
          amount: '7500',
          currency: 'BDT',
          category: 'travel',
          vendor: 'ACME',
          itemValue: '7500',
          price: '7500',
          quantity: '1',
          status: ExpenseStatus.DRAFT,
          customFieldsJson: {},
        }),
      );
    }

    if ((await this.leavesRepository.count()) === 0) {
      await this.leavesRepository.save(
        this.leavesRepository.create({
          requesterId: employee.id,
          departmentId: sales?.id ?? null,
          leaveType: 'ANNUAL',
          leaveDays: 2,
          startDate: '2026-06-10',
          endDate: '2026-06-11',
          reason: 'Seeded development leave',
          employeeGrade: 'G5',
          status: LeaveRequestStatus.DRAFT,
          customFieldsJson: {},
        }),
      );
    }

    const expense = await this.expensesRepository.findOne({
      where: { requesterId: employee.id },
      order: { createdAt: 'ASC' },
    });
    if (expense && (await this.paymentRequestsRepository.count()) === 0) {
      await this.paymentRequestsRepository.save(
        this.paymentRequestsRepository.create({
          expenseId: expense.id,
          requesterId: employee.id,
          amount: expense.amount,
          currency: expense.currency,
          status: PaymentRequestStatus.PENDING,
        }),
      );
    }

    if (expense && (await this.auditLogsRepository.count()) === 0) {
      await this.auditLogsRepository.save(
        this.auditLogsRepository.create({
          actorUserId: employee.id,
          action: 'EXPENSE_CREATED',
          entityType: 'Expense',
          entityId: expense.id,
          metadataJson: { seeded: true },
        }),
      );
    }

    if (expense && (await this.notificationsRepository.count()) === 0) {
      await this.notificationsRepository.save(
        this.notificationsRepository.create({
          recipientUserId: employee.id,
          title: 'Seed data ready',
          message: 'Development workflow demo records are available',
          type: NotificationType.SYSTEM,
          entityType: 'Expense',
          entityId: expense.id,
          workflowInstanceId: null,
          isRead: false,
          readAt: null,
        }),
      );
    }

    await this.seedDemoWorkflowInstance(employee, sales, expense);
  }

  private async seedDemoWorkflowInstance(
    employee: User,
    sales: Department | null,
    expense: Expense | null,
  ): Promise<void> {
    if (!expense || (await this.workflowInstancesRepository.count()) > 0)
      return;
    const template = await this.workflowTemplatesRepository.findOneBy({
      name: 'Expense Approval Workflow',
    });
    const rule = template
      ? await this.workflowApprovalRulesRepository.findOneBy({
          workflowTemplateId: template.id,
          isFallback: false,
        })
      : null;
    if (!template || !rule) return;

    const instance = await this.workflowInstancesRepository.save(
      this.workflowInstancesRepository.create({
        workflowTemplateId: template.id,
        workflowApprovalRuleId: rule.id,
        moduleName: 'expenses',
        eventName: 'expense.submitted',
        entityType: 'Expense',
        entityId: expense.id,
        requesterId: employee.id,
        departmentId: sales?.id ?? null,
        status: WorkflowInstanceStatus.ACTIVE,
        metadataJson: { seeded: true, amount: Number(expense.amount) },
        startedAt: new Date(),
      }),
    );
    const step = await this.workflowStepsRepository.save(
      this.workflowStepsRepository.create({
        workflowInstanceId: instance.id,
        stepOrder: 1,
        stepName: 'Department review',
        stepType: WorkflowStepType.REVIEW,
        assigneeType: WorkflowAssigneeType.ROLE,
        assignedRoleSlug: 'department-reviewer',
        assignedUserId: null,
        status: WorkflowStepStatus.ACTIVE,
        activatedAt: new Date(),
      }),
    );
    await this.workflowActionsRepository.save(
      this.workflowActionsRepository.create({
        workflowInstanceId: instance.id,
        workflowStepId: step.id,
        action: WorkflowActionType.TRIGGERED,
        actorUserId: employee.id,
        metadataJson: { seeded: true },
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
    }
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
    }
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
    }
    return rule;
  }

  private async ensureStep(
    workflowApprovalRuleId: string,
    values: Pick<
      WorkflowApprovalStepConfig,
      'stepOrder' | 'stepName' | 'stepType' | 'assigneeType'
    > & { assigneeRoleSlug?: string | null },
  ): Promise<void> {
    const exists = await this.workflowApprovalStepConfigsRepository.findOneBy({
      workflowApprovalRuleId,
      stepOrder: values.stepOrder,
    });
    if (!exists) {
      await this.workflowApprovalStepConfigsRepository.save(
        this.workflowApprovalStepConfigsRepository.create({
          workflowApprovalRuleId,
          stepOrder: values.stepOrder,
          stepName: values.stepName,
          stepType: values.stepType,
          assigneeType: values.assigneeType,
          assigneeRoleSlug: values.assigneeRoleSlug ?? null,
          assigneeUserId: null,
          assigneeFieldPath: null,
          isRequired: true,
          requiresComment: false,
          requiresAttachment: false,
          canReject: true,
          canReassign: false,
        }),
      );
    }
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
}
