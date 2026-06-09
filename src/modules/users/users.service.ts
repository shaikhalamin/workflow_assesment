import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../rbac/entities/permission.entity';
import { RolePermission } from '../rbac/entities/role-permission.entity';
import { Role } from '../rbac/entities/role.entity';
import { UserRole } from '../rbac/entities/user-role.entity';
import { User } from './entities/user.entity';

export interface UserWithAccess {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
}

interface UserAccessRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  roleSlug: string | null;
  permissionSlug: string | null;
}

const isString = (value: string | null): value is string => value !== null;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmailWithAccess(email: string): Promise<UserWithAccess | null> {
    return this.findOneWithAccess('user.email = :value', email);
  }

  findByIdWithAccess(id: string): Promise<UserWithAccess | null> {
    return this.findOneWithAccess('user.id = :value', id);
  }

  private async findOneWithAccess(
    where: string,
    value: string,
  ): Promise<UserWithAccess | null> {
    const rows = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.id', 'id')
      .addSelect('user.name', 'name')
      .addSelect('user.email', 'email')
      .addSelect('user.passwordHash', 'passwordHash')
      .addSelect('user.isActive', 'isActive')
      .addSelect('role.slug', 'roleSlug')
      .addSelect('permission.slug', 'permissionSlug')
      .leftJoin(UserRole, 'userRole', 'userRole.userId = user.id')
      .leftJoin(Role, 'role', 'role.id = userRole.roleId')
      .leftJoin(
        RolePermission,
        'rolePermission',
        'rolePermission.roleId = role.id',
      )
      .leftJoin(
        Permission,
        'permission',
        'permission.id = rolePermission.permissionId',
      )
      .where(where, { value })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getRawMany<UserAccessRow>();

    if (!rows.length) return null;

    const [user] = rows;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
      roles: [...new Set(rows.map((row) => row.roleSlug).filter(isString))],
      permissions: [
        ...new Set(rows.map((row) => row.permissionSlug).filter(isString)),
      ],
    };
  }
}
