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

  it('resolves role steps to the first active user for that role while keeping the role assignment', async () => {
    const queryBuilder = {
      innerJoin: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      getOne: jest.fn().mockResolvedValue({ id: 'finance-1' }),
    };
    queryBuilder.innerJoin.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    const usersRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const service = new AssigneeResolverService(
      usersRepository as never,
      {} as never,
    );

    await expect(
      service.resolve(
        {
          assigneeType: WorkflowAssigneeType.ROLE,
          assigneeRoleSlug: 'finance-admin',
        } as never,
        { requesterId: 'requester-1', metadata: {} },
      ),
    ).resolves.toEqual({
      assignedUserId: 'finance-1',
      assignedRoleSlug: 'finance-admin',
    });

    expect(queryBuilder.where).toHaveBeenCalledWith('role.slug = :roleSlug', {
      roleSlug: 'finance-admin',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'user.isActive = :isActive',
      { isActive: true },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('user.name', 'ASC');
  });

  it('rejects role steps when no active user has the configured role', async () => {
    const queryBuilder = {
      innerJoin: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    queryBuilder.innerJoin.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    const usersRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const service = new AssigneeResolverService(
      usersRepository as never,
      {} as never,
    );

    await expect(
      service.resolve(
        {
          assigneeType: WorkflowAssigneeType.ROLE,
          assigneeRoleSlug: 'finance-admin',
        } as never,
        { requesterId: 'requester-1', metadata: {} },
      ),
    ).rejects.toThrow('No active user found for role finance-admin');
  });
});
