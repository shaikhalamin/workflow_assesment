import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { PaymentsController } from './payments.controller';

describe('PaymentsController', () => {
  it('leaves payment read authorization to the service for requester-scoped access', () => {
    expect(controllerMethodPermissions('list')).toBeUndefined();
    expect(controllerMethodPermissions('findOne')).toBeUndefined();
  });

  it('keeps payment mutation restricted to payment writers', () => {
    expect(controllerMethodPermissions('markPaid')).toEqual(['payments.write']);
  });
});

function controllerMethodPermissions(
  methodName: 'list' | 'findOne' | 'markPaid',
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(
    PaymentsController.prototype,
    methodName,
  ) as { value: (...args: never[]) => unknown } | undefined;
  if (!descriptor) throw new Error(`Missing ${methodName} handler`);
  return Reflect.getMetadata(PERMISSIONS_KEY, descriptor.value);
}
