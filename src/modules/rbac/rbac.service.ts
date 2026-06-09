import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

interface PermissionRow {
  slug: string;
}

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRolesRepository: Repository<UserRole>,
  ) {}

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
}
