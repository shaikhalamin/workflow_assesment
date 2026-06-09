import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginateQb } from '../../common/http/paginate';
import { Paginated } from '../../common/http/paginated';
import { Permission } from '../rbac/entities/permission.entity';
import { RolePermission } from '../rbac/entities/role-permission.entity';
import { Role } from '../rbac/entities/role.entity';
import { UserRole } from '../rbac/entities/user-role.entity';
import { UserQueryDto } from './dto/user-query.dto';
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

export interface SignupUserInput {
  name: string;
  email: string;
  passwordHash: string;
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
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRolesRepository: Repository<UserRole>,
  ) {}

  findByEmailWithAccess(email: string): Promise<UserWithAccess | null> {
    return this.findOneWithAccess('user.email = :value', email);
  }

  findByIdWithAccess(id: string): Promise<UserWithAccess | null> {
    return this.findOneWithAccess('user.id = :value', id);
  }

  list(query: UserQueryDto): Promise<Paginated<User>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.employeeCode',
        'user.designation',
        'user.departmentId',
        'user.isActive',
      ])
      .orderBy('user.name', 'ASC');

    if (query.roleSlug) {
      qb.innerJoin(
        UserRole,
        'filterUserRole',
        'filterUserRole.userId = user.id',
      )
        .innerJoin(Role, 'filterRole', 'filterRole.id = filterUserRole.roleId')
        .andWhere('filterRole.slug = :roleSlug', {
          roleSlug: query.roleSlug,
        });
    }

    return paginateQb(qb, { page, limit, idColumn: 'user.id' });
  }

  async createSignupUser(input: SignupUserInput): Promise<UserWithAccess> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: input.email },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const employeeRole = await this.rolesRepository.findOne({
      where: { slug: 'employee' },
    });
    if (!employeeRole) {
      throw new InternalServerErrorException(
        'Default employee role is missing',
      );
    }

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        isActive: true,
      }),
    );

    await this.userRolesRepository.save(
      this.userRolesRepository.create({
        userId: user.id,
        roleId: employeeRole.id,
      }),
    );

    const userWithAccess = await this.findByIdWithAccess(user.id);
    if (!userWithAccess) {
      throw new InternalServerErrorException('Created user is unavailable');
    }

    return userWithAccess;
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
