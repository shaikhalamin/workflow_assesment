import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Department } from '../departments/entities/department.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { RolePermission } from '../rbac/entities/role-permission.entity';
import { Role } from '../rbac/entities/role.entity';
import { UserRole } from '../rbac/entities/user-role.entity';
import { User } from '../users/entities/user.entity';

type DepartmentSeed = { name: string; slug: string };
type RoleSeed = { name: string; slug: string; description?: string };
type PermissionSeed = {
  name: string;
  slug: string;
  resource: string;
  action: string;
};
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

  static readonly userSeeds: UserSeed[] = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      employeeCode: 'EMP-ADMIN',
      designation: 'System Administrator',
      departmentSlug: 'finance',
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
      designation: 'Accounts Officer',
      departmentSlug: 'accounts',
      roles: ['accounts-officer'],
    },
    {
      name: 'Finance Admin',
      email: 'finance@example.com',
      employeeCode: 'EMP-004',
      designation: 'Finance Admin',
      departmentSlug: 'finance',
      roles: ['finance-admin'],
    },
    {
      name: 'HR Officer',
      email: 'hr.officer@example.com',
      employeeCode: 'EMP-005',
      designation: 'HR Officer',
      departmentSlug: 'hr',
      roles: ['hr-officer'],
    },
    {
      name: 'HR Manager',
      email: 'hr.manager@example.com',
      employeeCode: 'EMP-006',
      designation: 'HR Manager',
      departmentSlug: 'hr',
      roles: ['hr-manager'],
    },
    {
      name: 'CFO User',
      email: 'cfo@example.com',
      employeeCode: 'EMP-007',
      designation: 'Chief Financial Officer',
      departmentSlug: 'finance',
      roles: ['cfo'],
    },
    {
      name: 'Payroll Officer',
      email: 'payroll@example.com',
      employeeCode: 'EMP-008',
      designation: 'Payroll Officer',
      departmentSlug: 'payroll',
      roles: ['payroll-officer'],
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
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') return;

    await this.seedDepartments();
    await this.seedRolesAndPermissions();
    await this.seedUsers();
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
    const roles = new Map<string, Role>();
    const permissions = new Map<string, Permission>();

    for (const seed of SeedService.roleSeeds) {
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
      roles.set(seed.slug, role);
    }

    for (const seed of SeedService.permissionSeeds) {
      let permission = await this.permissionsRepository.findOneBy({
        slug: seed.slug,
      });
      if (!permission) {
        permission = await this.permissionsRepository.save(
          this.permissionsRepository.create({ ...seed, description: null }),
        );
      }
      permissions.set(seed.slug, permission);
    }

    const admin = roles.get('admin');
    if (admin) {
      for (const permission of permissions.values()) {
        await this.ensureRolePermission(admin.id, permission.id);
      }
    }

    await this.assignPermissions(
      'employee',
      [
        'auth.profile.read',
        'expenses.read',
        'expenses.write',
        'leaves.read',
        'leaves.write',
        'dashboard.read',
        'workflow.runtime.act',
      ],
      roles,
      permissions,
    );
    await this.assignPermissions(
      'manager',
      [
        'auth.profile.read',
        'users.read',
        'expenses.read',
        'leaves.read',
        'dashboard.read',
        'workflow.runtime.act',
      ],
      roles,
      permissions,
    );
    await this.assignPermissions(
      'department-reviewer',
      [
        'auth.profile.read',
        'expenses.read',
        'leaves.read',
        'dashboard.read',
        'workflow.runtime.act',
      ],
      roles,
      permissions,
    );
    await this.assignPermissions(
      'accounts-officer',
      [
        'auth.profile.read',
        'expenses.read',
        'payments.read',
        'payments.write',
        'dashboard.read',
        'workflow.runtime.act',
      ],
      roles,
      permissions,
    );
    await this.assignPermissions(
      'finance-admin',
      [
        'auth.profile.read',
        'users.read',
        'expenses.read',
        'payments.read',
        'dashboard.read',
        'workflow.runtime.act',
      ],
      roles,
      permissions,
    );
    await this.assignPermissions(
      'hr-officer',
      [
        'auth.profile.read',
        'leaves.read',
        'dashboard.read',
        'workflow.runtime.act',
      ],
      roles,
      permissions,
    );
    await this.assignPermissions(
      'hr-manager',
      [
        'auth.profile.read',
        'users.read',
        'leaves.read',
        'dashboard.read',
        'workflow.runtime.act',
      ],
      roles,
      permissions,
    );
    await this.assignPermissions(
      'cfo',
      [
        'auth.profile.read',
        'expenses.read',
        'payments.read',
        'dashboard.read',
        'workflow.runtime.act',
      ],
      roles,
      permissions,
    );
    await this.assignPermissions(
      'payroll-officer',
      [
        'auth.profile.read',
        'payments.read',
        'payments.write',
        'dashboard.read',
        'workflow.runtime.act',
      ],
      roles,
      permissions,
    );
  }

  private async seedUsers(): Promise<void> {
    const departments = await this.seedDepartments();
    const roles = await this.rolesRepository.find();
    const rolesBySlug = new Map(roles.map((role) => [role.slug, role]));
    const passwordHash = await bcrypt.hash(SeedService.developmentPassword, 10);

    for (const seed of SeedService.userSeeds) {
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

      for (const roleSlug of seed.roles) {
        const role = rolesBySlug.get(roleSlug);
        if (role) await this.ensureUserRole(user.id, role.id);
      }
    }

    for (const seed of SeedService.userSeeds) {
      if (!seed.managerEmail) continue;
      const [user, manager] = await Promise.all([
        this.usersRepository.findOneBy({ email: seed.email }),
        this.usersRepository.findOneBy({ email: seed.managerEmail }),
      ]);
      if (user && manager && user.managerId !== manager.id) {
        user.managerId = manager.id;
        await this.usersRepository.save(user);
      }
    }

    const sales = departments.get('sales');
    const manager = await this.usersRepository.findOneBy({
      email: 'manager@example.com',
    });
    if (sales && manager && sales.headUserId !== manager.id) {
      sales.headUserId = manager.id;
      await this.departmentsRepository.save(sales);
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
    for (const permissionSlug of permissionSlugs) {
      const permission = permissions.get(permissionSlug);
      if (permission) await this.ensureRolePermission(role.id, permission.id);
    }
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
