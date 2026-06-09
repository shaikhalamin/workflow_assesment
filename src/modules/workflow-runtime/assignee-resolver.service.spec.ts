import { AssigneeResolverService } from './assignee-resolver.service';
import { WorkflowAssigneeType } from '../workflow-builder/enums/workflow-builder.enums';

describe('AssigneeResolverService', () => {
  it('resolves exact user steps', async () => {
    const service = new AssigneeResolverService({} as never, {} as never);
    await expect(
      service.resolve(
        {
          assigneeType: WorkflowAssigneeType.USER,
          assigneeUserId: 'user-1',
        } as never,
        { requesterId: 'requester-1', metadata: {} },
      ),
    ).resolves.toEqual({ assignedUserId: 'user-1', assignedRoleSlug: null });
  });
});
