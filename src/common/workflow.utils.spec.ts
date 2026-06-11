import {
  canResubmit,
  toIsoStringOrNull,
  toWorkflowUserResponse,
} from './workflow.utils';

describe('workflow utils', () => {
  it('maps workflow user responses from user-like values', () => {
    expect(toWorkflowUserResponse(null)).toBeNull();
    expect(toWorkflowUserResponse(undefined)).toBeNull();
    expect(
      toWorkflowUserResponse({
        id: 'user-1',
        name: 'Requester',
        email: 'requester@example.com',
      }),
    ).toEqual({
      id: 'user-1',
      name: 'Requester',
      email: 'requester@example.com',
    });
  });

  it('formats nullable dates as ISO strings', () => {
    expect(toIsoStringOrNull(null)).toBeNull();
    expect(toIsoStringOrNull(new Date('2026-06-11T08:00:00.000Z'))).toBe(
      '2026-06-11T08:00:00.000Z',
    );
  });

  it('checks workflow resubmission only for rejected requests with workflow instances', async () => {
    const allowsResubmission: jest.Mock<Promise<boolean>, [string]> = jest
      .fn<Promise<boolean>, [string]>()
      .mockResolvedValue(true);

    await expect(
      canResubmit(
        { status: 'DRAFT', workflowInstanceId: 'workflow-1' },
        'REJECTED',
        allowsResubmission,
      ),
    ).resolves.toBe(false);
    await expect(
      canResubmit(
        { status: 'REJECTED', workflowInstanceId: null },
        'REJECTED',
        allowsResubmission,
      ),
    ).resolves.toBe(false);
    await expect(
      canResubmit(
        { status: 'REJECTED', workflowInstanceId: 'workflow-1' },
        'REJECTED',
        allowsResubmission,
      ),
    ).resolves.toBe(true);

    expect(allowsResubmission).toHaveBeenCalledTimes(1);
    expect(allowsResubmission).toHaveBeenCalledWith('workflow-1');
  });
});
