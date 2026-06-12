import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { InvoicesController } from './invoices.controller';

describe('InvoicesController', () => {
  it('allows billing readers to reach invoice read endpoints for row-level visibility checks', () => {
    const listPermissions = controllerMethodPermissions('list');
    const findOnePermissions = controllerMethodPermissions('findOne');

    expect(listPermissions).toEqual(['billing.read']);
    expect(findOnePermissions).toEqual(['billing.read']);
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
