import { BadRequestException } from '@nestjs/common';
import type { TriggerWorkflowDto } from '../workflow-runtime/dto/trigger-workflow.dto';
import { WorkflowStepStatus } from '../workflow-runtime/enums/workflow-runtime.enums';
import type { TriggerWorkflowResult } from '../workflow-runtime/workflow-runtime.service';
import { LeavesService } from './leaves.service';
import { LeaveRequestStatus } from './entities/leave-request.entity';

describe('LeavesService', () => {
  it('stores the actor as requester and creator when creating a leave request', async () => {
    const savedLeave = {
      id: 'leave-1',
      requesterId: 'requester-1',
      createdById: 'requester-1',
      departmentId: null,
      leaveType: 'ANNUAL',
      leaveDays: 2,
      startDate: '2026-06-10',
      endDate: '2026-06-11',
      reason: null,
      employeeGrade: null,
      status: LeaveRequestStatus.DRAFT,
      workflowInstanceId: null,
      rejectionReason: null,
      approvedPeriodJson: null,
      customFieldsJson: null,
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      createdAt: new Date('2026-06-10T09:30:00.000Z'),
      updatedAt: new Date('2026-06-10T09:30:00.000Z'),
    };
    const repo = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn().mockResolvedValue(savedLeave),
      findOne: jest.fn().mockResolvedValue({
        ...savedLeave,
        requester: null,
        createdBy: null,
      }),
    };
    const service = new LeavesService(repo as never, {} as never, {} as never);

    await service.create(
      {
        leaveType: 'ANNUAL',
        leaveDays: 2,
        startDate: '2026-06-10',
        endDate: '2026-06-11',
      },
      { userId: 'requester-1', roles: [] } as never,
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: 'requester-1',
        createdById: 'requester-1',
      }),
    );
  });

  it('loads requester and creator relations for leave detail responses', async () => {
    const requester = {
      id: 'requester-1',
      name: 'Leave Requester',
      email: 'requester@example.com',
    };
    const creator = {
      id: 'creator-1',
      name: 'Leave Creator',
      email: 'creator@example.com',
    };
    const leave = {
      id: 'leave-1',
      requesterId: 'requester-1',
      requester,
      createdById: 'creator-1',
      createdBy: creator,
      departmentId: 'dept-1',
      leaveType: 'ANNUAL',
      leaveDays: 2,
      startDate: '2026-06-10',
      endDate: '2026-06-11',
      reason: 'Family event',
      employeeGrade: 'G5',
      status: LeaveRequestStatus.DRAFT,
      workflowInstanceId: null,
      rejectionReason: null,
      approvedPeriodJson: null,
      customFieldsJson: null,
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      createdAt: new Date('2026-06-10T09:30:00.000Z'),
      updatedAt: new Date('2026-06-10T09:30:00.000Z'),
    };
    const repo = {
      findOne: jest.fn().mockResolvedValue(leave),
    };
    const service = new LeavesService(repo as never, {} as never, {} as never);

    const response = await service.findOne('leave-1', {
      userId: 'requester-1',
      roles: [],
    } as never);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 'leave-1' },
      relations: { createdBy: true, requester: true },
    });
    expect(response.requester).toEqual(requester);
    expect(response.createdBy).toEqual(creator);
  });

  it('marks rejected leave requests as resubmittable when the workflow allows it', async () => {
    const leave = {
      id: 'leave-1',
      requesterId: 'requester-1',
      requester: null,
      createdById: 'requester-1',
      createdBy: null,
      departmentId: 'dept-1',
      leaveType: 'ANNUAL',
      leaveDays: 2,
      startDate: '2026-06-10',
      endDate: '2026-06-11',
      reason: 'Family event',
      employeeGrade: 'G5',
      status: LeaveRequestStatus.REJECTED,
      workflowInstanceId: 'workflow-1',
      rejectionReason: 'Insufficient balance',
      approvedPeriodJson: null,
      customFieldsJson: null,
      submittedAt: new Date('2026-06-10T09:30:00.000Z'),
      approvedAt: null,
      rejectedAt: new Date('2026-06-11T09:30:00.000Z'),
      createdAt: new Date('2026-06-10T09:30:00.000Z'),
      updatedAt: new Date('2026-06-11T09:30:00.000Z'),
    };
    const repo = {
      findOne: jest.fn().mockResolvedValue(leave),
    };
    const runtime = {
      allowsResubmission: jest.fn().mockResolvedValue(true),
    };
    const service = new LeavesService(
      repo as never,
      runtime as never,
      {} as never,
    );

    const response = await service.findOne('leave-1', {
      userId: 'requester-1',
      roles: [],
    } as never);

    expect(runtime.allowsResubmission).toHaveBeenCalledWith('workflow-1');
    expect(response.canResubmit).toBe(true);
  });

  it('submits a draft leave request and triggers workflow metadata', async () => {
    const leave = {
      id: 'leave-1',
      requesterId: 'user-1',
      requester: null,
      createdById: 'user-1',
      createdBy: null,
      departmentId: 'dept-1',
      leaveType: 'ANNUAL',
      leaveDays: 2,
      startDate: '2026-06-10',
      endDate: '2026-06-11',
      reason: null,
      status: LeaveRequestStatus.DRAFT,
      employeeGrade: 'G5',
      workflowInstanceId: null,
      rejectionReason: null,
      approvedPeriodJson: null,
      customFieldsJson: {},
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      createdAt: new Date('2026-06-10T09:30:00.000Z'),
      updatedAt: new Date('2026-06-10T09:30:00.000Z'),
    };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(leave),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    const runtime: {
      trigger: jest.Mock<Promise<TriggerWorkflowResult>, [TriggerWorkflowDto]>;
    } = {
      trigger: jest
        .fn<Promise<TriggerWorkflowResult>, [TriggerWorkflowDto]>()
        .mockResolvedValue({
          status: 'triggered',
          workflowInstanceId: 'wi-2',
          activeStep: {
            id: 'step-1',
            stepName: 'Review',
            stepOrder: 1,
            assignedUserId: null,
            assignedRoleSlug: 'manager',
            status: WorkflowStepStatus.ACTIVE,
          },
        }),
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
    const triggerCall = runtime.trigger.mock.calls[0]?.[0];
    expect(triggerCall?.metadata).toEqual(
      expect.objectContaining({
        title: 'Annual leave request',
        leaveType: 'ANNUAL',
        leaveDays: 2,
      }),
    );
  });

  it('rejects submitting a draft leave request when no published workflow applies', async () => {
    const leave = {
      id: 'leave-1',
      requesterId: 'user-1',
      requester: null,
      createdById: 'user-1',
      createdBy: null,
      departmentId: 'dept-1',
      leaveType: 'ANNUAL',
      leaveDays: 2,
      startDate: '2026-06-10',
      endDate: '2026-06-11',
      reason: null,
      status: LeaveRequestStatus.DRAFT,
      employeeGrade: 'G5',
      workflowInstanceId: null,
      rejectionReason: null,
      approvedPeriodJson: null,
      customFieldsJson: {},
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      createdAt: new Date('2026-06-10T09:30:00.000Z'),
      updatedAt: new Date('2026-06-10T09:30:00.000Z'),
    };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(leave),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    const runtime = {
      trigger: jest.fn().mockResolvedValue({ status: 'skipped' }),
    };
    const service = new LeavesService(
      repo as never,
      runtime as never,
      {} as never,
    );

    await expect(
      service.submit('leave-1', { userId: 'user-1' } as never),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repo.save).not.toHaveBeenCalled();
    expect(leave.status).toBe(LeaveRequestStatus.DRAFT);
  });

  it('rejects resubmitting a leave request when the workflow disallows it', async () => {
    const leave = {
      id: 'leave-1',
      requesterId: 'user-1',
      status: LeaveRequestStatus.REJECTED,
      workflowInstanceId: 'workflow-1',
    };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(leave),
      save: jest.fn(),
    };
    const runtime = {
      allowsResubmission: jest.fn().mockResolvedValue(false),
    };
    const service = new LeavesService(
      repo as never,
      runtime as never,
      {} as never,
    );

    await expect(
      service.resubmit('leave-1', {}, { userId: 'user-1', roles: [] } as never),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(runtime.allowsResubmission).toHaveBeenCalledWith('workflow-1');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('deletes a draft leave request owned by the requester', async () => {
    const leave = {
      id: 'leave-1',
      requesterId: 'requester-1',
      status: LeaveRequestStatus.DRAFT,
    };
    const repo = {
      findOneBy: jest.fn().mockResolvedValue(leave),
      remove: jest.fn().mockResolvedValue(leave),
    };
    const auditLogs = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const service = new LeavesService(
      repo as never,
      {} as never,
      auditLogs as never,
    );

    const response = await service.delete('leave-1', {
      userId: 'requester-1',
      roles: [],
    } as never);

    expect(repo.remove).toHaveBeenCalledWith(leave);
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LEAVE_DELETED',
        entityId: 'leave-1',
      }),
    );
    expect(response).toEqual({ success: true });
  });

  it('rejects deleting a leave request after it is submitted for approval', async () => {
    const repo = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 'leave-1',
        requesterId: 'requester-1',
        status: LeaveRequestStatus.UNDER_REVIEW,
      }),
      remove: jest.fn(),
    };
    const service = new LeavesService(repo as never, {} as never, {} as never);

    await expect(
      service.delete('leave-1', {
        userId: 'requester-1',
        roles: [],
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
