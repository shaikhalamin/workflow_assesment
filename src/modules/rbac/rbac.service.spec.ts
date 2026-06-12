import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RbacService } from './rbac.service';

type MockRepository<T extends object> = Pick<
  Repository<T>,
  'find' | 'findOne' | 'findOneBy' | 'delete' | 'create' | 'save'
>;

function repository<T extends object>(): jest.Mocked<MockRepository<T>> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
    create: jest.fn((value: Partial<T>) => value as T),
    save: jest.fn(),
  };
}

function asRepository<T extends object>(
  repo: jest.Mocked<MockRepository<T>>,
): Repository<T> {
  return repo as unknown as Repository<T>;
}

const role = (slug: string, name = slug): Role => ({
  id: `${slug}-id`,
  name,
  slug,
  description: null,
  isSystem: true,
  createdAt: new Date('2026-06-12T01:00:00.000Z'),
  updatedAt: new Date('2026-06-12T02:00:00.000Z'),
});

const permission = (
  slug: string,
  resource: string,
  action: string,
): Permission => ({
  id: `${slug}-id`,
  name: slug,
  slug,
  description: null,
  resource,
  action,
  createdAt: new Date('2026-06-12T01:00:00.000Z'),
  updatedAt: new Date('2026-06-12T02:00:00.000Z'),
});

describe('RbacService management methods', () => {
  let rolesRepository: jest.Mocked<MockRepository<Role>>;
  let permissionsRepository: jest.Mocked<MockRepository<Permission>>;
  let rolePermissionsRepository: jest.Mocked<MockRepository<RolePermission>>;
  let userRolesRepository: jest.Mocked<MockRepository<UserRole>>;
  let dataSource: { transaction: jest.Mock };
  let service: RbacService;

  beforeEach(() => {
    rolesRepository = repository<Role>();
    permissionsRepository = repository<Permission>();
    rolePermissionsRepository = repository<RolePermission>();
    userRolesRepository = repository<UserRole>();
    dataSource = {
      transaction: jest.fn(
        async (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback({
            getRepository: (entity: object) => {
              if (entity === RolePermission) return rolePermissionsRepository;
              return {};
            },
          } as EntityManager),
      ),
    };
    service = new RbacService(
      asRepository(userRolesRepository),
      asRepository(rolesRepository),
      asRepository(permissionsRepository),
      asRepository(rolePermissionsRepository),
      dataSource as unknown as DataSource,
    );
  });

  it('lists roles with permission slugs and locked admin state', async () => {
    rolesRepository.find.mockResolvedValue([
      role('admin', 'Admin'),
      role('employee', 'Employee'),
    ]);
    rolePermissionsRepository.find.mockResolvedValue([
      {
        id: 'rp-1',
        roleId: 'employee-id',
        permissionId: 'p-1',
        role: role('employee'),
        permission: permission('expenses.read', 'expenses', 'read'),
        createdAt: new Date(),
      },
      {
        id: 'rp-2',
        roleId: 'admin-id',
        permissionId: 'p-2',
        role: role('admin'),
        permission: permission('users.read', 'users', 'read'),
        createdAt: new Date(),
      },
    ]);

    await expect(service.listRoles()).resolves.toEqual([
      expect.objectContaining({
        slug: 'admin',
        isLocked: true,
        permissionSlugs: ['users.read'],
      }),
      expect.objectContaining({
        slug: 'employee',
        isLocked: false,
        permissionSlugs: ['expenses.read'],
      }),
    ]);
  });

  it('lists permissions sorted by resource and action', async () => {
    permissionsRepository.find.mockResolvedValue([
      permission('dashboard.read', 'dashboard', 'read'),
      permission('expenses.write', 'expenses', 'write'),
    ]);

    await expect(service.listPermissions()).resolves.toEqual([
      expect.objectContaining({
        slug: 'dashboard.read',
        resource: 'dashboard',
        action: 'read',
      }),
      expect.objectContaining({
        slug: 'expenses.write',
        resource: 'expenses',
        action: 'write',
      }),
    ]);
    expect(permissionsRepository.find).toHaveBeenCalledWith({
      order: { resource: 'ASC', action: 'ASC', slug: 'ASC' },
    });
  });

  it('replaces non-admin role permissions and deduplicates slugs', async () => {
    const employee = role('employee', 'Employee');
    const read = permission('expenses.read', 'expenses', 'read');
    const write = permission('expenses.write', 'expenses', 'write');
    rolesRepository.findOneBy.mockResolvedValue(employee);
    permissionsRepository.find.mockResolvedValue([read, write]);
    rolePermissionsRepository.save.mockResolvedValue([]);
    rolePermissionsRepository.find.mockResolvedValue([
      {
        id: 'rp-1',
        roleId: employee.id,
        permissionId: read.id,
        role: employee,
        permission: read,
        createdAt: new Date(),
      },
      {
        id: 'rp-2',
        roleId: employee.id,
        permissionId: write.id,
        role: employee,
        permission: write,
        createdAt: new Date(),
      },
    ]);

    await expect(
      service.replaceRolePermissions('employee', [
        'expenses.read',
        'expenses.read',
        'expenses.write',
      ]),
    ).resolves.toEqual(
      expect.objectContaining({
        slug: 'employee',
        permissionSlugs: ['expenses.read', 'expenses.write'],
      }),
    );
    expect(rolePermissionsRepository.delete).toHaveBeenCalledWith({
      roleId: employee.id,
    });
    expect(rolePermissionsRepository.save).toHaveBeenCalledTimes(1);
  });

  it('allows empty permissions for non-admin roles', async () => {
    rolesRepository.findOneBy.mockResolvedValue(role('employee', 'Employee'));
    rolePermissionsRepository.find.mockResolvedValue([]);

    await expect(
      service.replaceRolePermissions('employee', []),
    ).resolves.toEqual(
      expect.objectContaining({ slug: 'employee', permissionSlugs: [] }),
    );
    expect(permissionsRepository.find).not.toHaveBeenCalled();
  });

  it('blocks admin updates', async () => {
    await expect(
      service.replaceRolePermissions('admin', []),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns not found for an unknown role', async () => {
    rolesRepository.findOneBy.mockResolvedValue(null);
    await expect(
      service.replaceRolePermissions('missing', []),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects unknown permission slugs', async () => {
    rolesRepository.findOneBy.mockResolvedValue(role('employee', 'Employee'));
    permissionsRepository.find.mockResolvedValue([
      permission('expenses.read', 'expenses', 'read'),
    ]);

    await expect(
      service.replaceRolePermissions('employee', [
        'expenses.read',
        'missing.permission',
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
