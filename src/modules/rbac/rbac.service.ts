import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  RbacPermissionResponseDto,
  RbacRoleResponseDto,
} from './dto/rbac-management.dto';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

const ADMIN_ROLE_SLUG = 'admin';

interface PermissionRow {
  slug: string;
}

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRolesRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepository: Repository<RolePermission>,
    private readonly dataSource: DataSource,
  ) {}

  async listRoles(): Promise<RbacRoleResponseDto[]> {
    const roles = await this.rolesRepository.find({ order: { name: 'ASC' } });
    const rolePermissions = await this.rolePermissionsRepository.find({
      relations: { permission: true },
    });
    return roles.map((role) => this.toRoleResponse(role, rolePermissions));
  }

  async listPermissions(): Promise<RbacPermissionResponseDto[]> {
    const permissions = await this.permissionsRepository.find({
      order: { resource: 'ASC', action: 'ASC', slug: 'ASC' },
    });
    return permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      slug: permission.slug,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
      createdAt: permission.createdAt.toISOString(),
      updatedAt: permission.updatedAt.toISOString(),
    }));
  }

  async replaceRolePermissions(
    roleSlug: string,
    permissionSlugs: string[],
  ): Promise<RbacRoleResponseDto> {
    if (roleSlug === ADMIN_ROLE_SLUG) {
      throw new BadRequestException('Admin role permissions cannot be edited');
    }

    const role = await this.rolesRepository.findOneBy({ slug: roleSlug });
    if (!role) throw new NotFoundException('Role not found');

    const uniqueSlugs = Array.from(new Set(permissionSlugs));
    const permissions = uniqueSlugs.length
      ? await this.permissionsRepository.find({
          where: { slug: In(uniqueSlugs) },
        })
      : [];
    const foundSlugs = new Set(
      permissions.map((permission) => permission.slug),
    );
    const missingSlug = uniqueSlugs.find((slug) => !foundSlugs.has(slug));

    if (missingSlug) {
      throw new BadRequestException(`Unknown permission slug: ${missingSlug}`);
    }

    await this.dataSource.transaction(async (manager) => {
      const rolePermissionRepository = manager.getRepository(RolePermission);
      await rolePermissionRepository.delete({ roleId: role.id });
      if (!permissions.length) return;

      await rolePermissionRepository.save(
        permissions.map((permission) =>
          rolePermissionRepository.create({
            roleId: role.id,
            permissionId: permission.id,
          }),
        ),
      );
    });

    const rolePermissions = await this.rolePermissionsRepository.find({
      where: { roleId: role.id },
      relations: { permission: true },
    });
    return this.toRoleResponse(role, rolePermissions);
  }

  async userHasRole(userId: string, roleSlug: string): Promise<boolean> {
    const count = await this.userRolesRepository
      .createQueryBuilder('userRole')
      .innerJoin(Role, 'role', 'role.id = userRole.roleId')
      .where('userRole.userId = :userId', { userId })
      .andWhere('role.slug = :roleSlug', { roleSlug })
      .getCount();

    return count > 0;
  }

  async permissionsForUser(userId: string): Promise<string[]> {
    const rows = await this.userRolesRepository
      .createQueryBuilder('userRole')
      .select('DISTINCT permission.slug', 'slug')
      .innerJoin(Role, 'role', 'role.id = userRole.roleId')
      .innerJoin(
        RolePermission,
        'rolePermission',
        'rolePermission.roleId = role.id',
      )
      .innerJoin(
        Permission,
        'permission',
        'permission.id = rolePermission.permissionId',
      )
      .where('userRole.userId = :userId', { userId })
      .getRawMany<PermissionRow>();

    return rows.map((row) => row.slug);
  }

  private toRoleResponse(
    role: Role,
    rolePermissions: RolePermission[],
  ): RbacRoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      isLocked: role.slug === ADMIN_ROLE_SLUG,
      permissionSlugs: rolePermissions
        .filter((rolePermission) => rolePermission.roleId === role.id)
        .map((rolePermission) => rolePermission.permission.slug)
        .sort(),
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }
}
