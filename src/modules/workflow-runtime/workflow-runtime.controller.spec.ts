import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { WorkflowRuntimeController } from './workflow-runtime.controller';

describe('WorkflowRuntimeController', () => {
  it('requires runtime read permission for runtime read endpoints', () => {
    expect(controllerMethodPermissions('list')).toEqual([
      'workflow.runtime.read',
    ]);
    expect(controllerMethodPermissions('findOne')).toEqual([
      'workflow.runtime.read',
    ]);
  });

  it('keeps task queue and mutations restricted to runtime actors', () => {
    expect(controllerMethodPermissions('myPending')).toEqual([
      'workflow.runtime.act',
    ]);
    expect(controllerMethodPermissions('approve')).toEqual([
      'workflow.runtime.act',
    ]);
    expect(controllerMethodPermissions('reject')).toEqual([
      'workflow.runtime.act',
    ]);
    expect(controllerMethodPermissions('comment')).toEqual([
      'workflow.runtime.act',
    ]);
  });
});

function controllerMethodPermissions(
  methodName:
    | 'list'
    | 'findOne'
    | 'myPending'
    | 'approve'
    | 'reject'
    | 'comment',
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(
    WorkflowRuntimeController.prototype,
    methodName,
  ) as { value: (...args: never[]) => unknown } | undefined;
  if (!descriptor) throw new Error(`Missing ${methodName} handler`);
  return Reflect.getMetadata(PERMISSIONS_KEY, descriptor.value);
}
