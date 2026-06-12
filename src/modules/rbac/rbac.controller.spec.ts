import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { RbacController } from './rbac.controller';

describe('RbacController', () => {
  it('protects the controller with the admin role', () => {
    expect(Reflect.getMetadata(ROLES_KEY, RbacController)).toEqual(['admin']);
  });

  it.each(['listRoles', 'listPermissions', 'replaceRolePermissions'] as const)(
    'inherits admin-only access for %s',
    (methodName) => {
      const descriptor = Object.getOwnPropertyDescriptor(
        RbacController.prototype,
        methodName,
      ) as { value: (...args: never[]) => unknown } | undefined;

      expect(descriptor).toBeDefined();
      if (!descriptor) throw new Error(`Missing ${methodName} handler`);
      expect(Reflect.getMetadata(ROLES_KEY, descriptor.value)).toBeUndefined();
    },
  );
});
