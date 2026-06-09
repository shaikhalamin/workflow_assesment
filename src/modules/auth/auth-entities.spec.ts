import { getMetadataArgsStorage } from 'typeorm';
import { RefreshTokenSession } from './entities/refresh-token-session.entity';
import { Department } from '../departments/entities/department.entity';
import { Role } from '../rbac/entities/role.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { RolePermission } from '../rbac/entities/role-permission.entity';
import { UserRole } from '../rbac/entities/user-role.entity';
import { User } from '../users/entities/user.entity';

describe('auth and rbac entities', () => {
  it('registers the expected tables', () => {
    const tables = getMetadataArgsStorage().tables.map((table) => table.target);
    expect(tables).toEqual(
      expect.arrayContaining([
        Department,
        User,
        Role,
        Permission,
        RolePermission,
        UserRole,
        RefreshTokenSession,
      ]),
    );
  });

  it('keeps stable role and permission slug columns unique', () => {
    const uniques = getMetadataArgsStorage().uniques.map((unique) => ({
      target: unique.target,
      columns: unique.columns,
    }));
    expect(uniques).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ target: Role, columns: ['slug'] }),
        expect.objectContaining({ target: Permission, columns: ['slug'] }),
        expect.objectContaining({ target: Department, columns: ['slug'] }),
      ]),
    );
  });

  it('keeps sensitive hash columns out of default selections', () => {
    const columns = getMetadataArgsStorage().columns.map((column) => ({
      target: column.target,
      propertyName: column.propertyName,
      select: column.options.select,
    }));

    expect(columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target: User,
          propertyName: 'passwordHash',
          select: false,
        }),
        expect.objectContaining({
          target: RefreshTokenSession,
          propertyName: 'tokenHash',
          select: false,
        }),
      ]),
    );
  });

  it('registers relations for intended auth and organization foreign keys', () => {
    const relations = getMetadataArgsStorage().relations.map((relation) => ({
      target: relation.target,
      propertyName: relation.propertyName,
      relationType: relation.relationType,
      type: relation.type() as unknown,
      onDelete: relation.options.onDelete,
    }));
    const joinColumns = getMetadataArgsStorage().joinColumns.map(
      (joinColumn) => ({
        target: joinColumn.target,
        propertyName: joinColumn.propertyName,
        name: joinColumn.name,
      }),
    );

    expect(relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target: User,
          propertyName: 'department',
          relationType: 'many-to-one',
          type: Department,
          onDelete: 'SET NULL',
        }),
        expect.objectContaining({
          target: User,
          propertyName: 'manager',
          relationType: 'many-to-one',
          type: User,
          onDelete: 'SET NULL',
        }),
        expect.objectContaining({
          target: Department,
          propertyName: 'headUser',
          relationType: 'many-to-one',
          type: User,
          onDelete: 'SET NULL',
        }),
        expect.objectContaining({
          target: RefreshTokenSession,
          propertyName: 'user',
          relationType: 'many-to-one',
          type: User,
          onDelete: 'CASCADE',
        }),
        expect.objectContaining({
          target: RefreshTokenSession,
          propertyName: 'replacedBySession',
          relationType: 'many-to-one',
          type: RefreshTokenSession,
          onDelete: 'SET NULL',
        }),
      ]),
    );
    expect(joinColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target: User,
          propertyName: 'department',
          name: 'departmentId',
        }),
        expect.objectContaining({
          target: User,
          propertyName: 'manager',
          name: 'managerId',
        }),
        expect.objectContaining({
          target: Department,
          propertyName: 'headUser',
          name: 'headUserId',
        }),
        expect.objectContaining({
          target: RefreshTokenSession,
          propertyName: 'user',
          name: 'userId',
        }),
        expect.objectContaining({
          target: RefreshTokenSession,
          propertyName: 'replacedBySession',
          name: 'replacedBySessionId',
        }),
      ]),
    );
  });
});
