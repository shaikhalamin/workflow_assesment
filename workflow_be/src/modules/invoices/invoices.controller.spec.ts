import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { InvoicesController } from './invoices.controller';

describe('InvoicesController', () => {
  it('requires invoice read permission for invoice read endpoints', () => {
    const listPermissions = controllerMethodPermissions('list');
    const findOnePermissions = controllerMethodPermissions('findOne');

    expect(listPermissions).toEqual(['invoices.read']);
    expect(findOnePermissions).toEqual(['invoices.read']);
  });
});

function controllerMethodPermissions(methodName: 'list' | 'findOne'): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(
    InvoicesController.prototype,
    methodName,
  ) as { value: (...args: never[]) => unknown } | undefined;
  if (!descriptor) throw new Error(`Missing ${methodName} handler`);
  const permissions: unknown = Reflect.getMetadata(
    PERMISSIONS_KEY,
    descriptor.value,
  );
  return permissions;
}
