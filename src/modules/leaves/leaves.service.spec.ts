import { LeavesService } from './leaves.service';
import { LeaveRequestStatus } from './entities/leave-request.entity';

describe('LeavesService', () => {
  it('submits a draft leave request and triggers workflow metadata', async () => {
    const leave = {
      id: 'leave-1',
      requesterId: 'user-1',
      departmentId: 'dept-1',
      leaveType: 'ANNUAL',
      leaveDays: 2,
      status: LeaveRequestStatus.DRAFT,
      employeeGrade: 'G5',
      customFieldsJson: {},
    };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(leave),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    const runtime = {
      trigger: jest.fn().mockResolvedValue({ workflowInstanceId: 'wi-2' }),
    };
    const service = new LeavesService(
      repo as never,
      runtime as never,
      {} as never,
    );

    await service.submit('leave-1', { userId: 'user-1' } as never);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: LeaveRequestStatus.UNDER_REVIEW,
        workflowInstanceId: 'wi-2',
      }),
    );
  });
});
