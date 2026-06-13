import { BadRequestException } from '@nestjs/common';
import type { TriggerWorkflowDto } from '../workflow-runtime/dto/trigger-workflow.dto';
import { WorkflowStepStatus } from '../workflow-runtime/enums/workflow-runtime.enums';
import type { TriggerWorkflowResult } from '../workflow-runtime/workflow-runtime.service';
import { BillingService } from './billing.service';
import {
  BillingRequest,
  BillingRequestStatus,
} from './entities/billing-request.entity';

describe('BillingService', () => {
  it('submits a draft billing request and triggers workflow metadata', async () => {
    const billingRequest = {
      id: 'billing-1',
      requesterId: 'user-1',
      departmentId: 'dept-1',
      customerName: 'ACME Bangladesh Ltd.',
      customerEmail: 'billing@acme.example',
      customerAddress: 'Dhaka',
      title: 'Enterprise installation',
      description: null,
      amount: '125000',
      currency: 'BDT',
      billingCategory: 'Installation',
      status: BillingRequestStatus.DRAFT,
      workflowInstanceId: null,
      invoiceId: null,
      rejectionReason: null,
      customFieldsJson: { projectCode: 'PRJ-1' },
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
    };
    const createdAt = new Date('2026-06-10T08:00:00.000Z');
    const billingRequestsRepository = {
      findOneBy: jest.fn().mockResolvedValue(billingRequest),
      findOne: jest.fn().mockResolvedValue({
        ...billingRequest,
        requester: null,
        submittedAt: new Date('2026-06-11T08:00:00.000Z'),
        createdAt,
        updatedAt: createdAt,
      }),
      save: jest.fn().mockImplementation((value: BillingRequest) =>
        Promise.resolve({
          ...value,
          createdAt,
          updatedAt: createdAt,
        }),
      ),
    };
    const runtime: {
      trigger: jest.Mock<Promise<TriggerWorkflowResult>, [TriggerWorkflowDto]>;
      allowsResubmission: jest.Mock<Promise<boolean>, [string]>;
    } = {
      trigger: jest
        .fn<Promise<TriggerWorkflowResult>, [TriggerWorkflowDto]>()
        .mockResolvedValue({
          status: 'triggered',
          workflowInstanceId: 'workflow-1',
          activeStep: {
            id: 'step-1',
            stepName: 'Accounts Review',
            stepOrder: 1,
            assignedUserId: null,
            assignedRoleSlug: 'accounts-officer',
            status: WorkflowStepStatus.ACTIVE,
          },
        }),
      allowsResubmission: jest.fn<Promise<boolean>, [string]>(),
    };
    const auditLogs = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const service = new BillingService(
      billingRequestsRepository as never,
      runtime as never,
      auditLogs as never,
    );

    await service.submit('billing-1', {
      userId: 'user-1',
      roles: ['sales-officer'],
      permissions: [],
    } as never);

    expect(
      billingRequestsRepository.save.mock.invocationCallOrder[0],
    ).toBeLessThan(runtime.trigger.mock.invocationCallOrder[0] ?? 0);
    const triggerCall = runtime.trigger.mock.calls[0]?.[0];
    expect(triggerCall).toEqual(
      expect.objectContaining({
        moduleName: 'billing',
        eventName: 'billing.submitted',
        entityType: 'BillingRequest',
        entityId: 'billing-1',
      }),
    );
    expect(triggerCall?.metadata).toEqual(
      expect.objectContaining({
        title: 'Enterprise installation',
        amount: 125000,
        currency: 'BDT',
        billingCategory: 'Installation',
        customerName: 'ACME Bangladesh Ltd.',
        customFields: { projectCode: 'PRJ-1' },
      }),
    );
    expect(billingRequestsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: BillingRequestStatus.UNDER_REVIEW,
        rejectionReason: null,
      }),
    );
    expect(billingRequestsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowInstanceId: 'workflow-1',
      }),
    );
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BILLING_REQUEST_SUBMITTED',
        oldStatus: BillingRequestStatus.DRAFT,
        newStatus: BillingRequestStatus.UNDER_REVIEW,
      }),
    );
  });

  it('rejects submitting a billing request when no workflow applies', async () => {
    const billingRequest = {
      id: 'billing-1',
      requesterId: 'user-1',
      status: BillingRequestStatus.DRAFT,
      amount: '1000',
      currency: 'BDT',
      title: 'Billing',
      billingCategory: 'Service',
      customerName: 'Customer',
      departmentId: null,
      customFieldsJson: null,
    };
    const service = new BillingService(
      {
        findOneBy: jest.fn().mockResolvedValue(billingRequest),
        save: jest.fn(),
      } as never,
      { trigger: jest.fn().mockResolvedValue({ status: 'skipped' }) } as never,
      {} as never,
    );

    await expect(
      service.submit('billing-1', {
        userId: 'user-1',
        roles: ['sales-officer'],
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows managers to read billing requests without department matching', async () => {
    const createdAt = new Date('2026-06-10T08:00:00.000Z');
    const billingRequest = {
      id: 'billing-1',
      requesterId: 'requester-1',
      requester: null,
      departmentId: 'dept-1',
      customerName: 'ACME Bangladesh Ltd.',
      customerEmail: 'billing@acme.example',
      customerAddress: 'Dhaka',
      title: 'Enterprise installation',
      description: null,
      amount: '125000',
      currency: 'BDT',
      billingCategory: 'Installation',
      status: BillingRequestStatus.UNDER_REVIEW,
      workflowInstanceId: 'workflow-1',
      invoiceId: null,
      rejectionReason: null,
      customFieldsJson: null,
      submittedAt: createdAt,
      approvedAt: null,
      rejectedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
    const billingRequestsRepository = {
      findOne: jest.fn().mockResolvedValue(billingRequest),
    };
    const service = new BillingService(
      billingRequestsRepository as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.findOne('billing-1', {
        userId: 'manager-1',
        departmentId: 'dept-2',
        roles: ['manager'],
      } as never),
    ).resolves.toEqual(expect.objectContaining({ id: 'billing-1' }));
  });

  it('returns the billing request creator on list and detail responses', async () => {
    const createdAt = new Date('2026-06-10T08:00:00.000Z');
    const creator = {
      id: 'creator-1',
      name: 'Billing Creator',
      email: 'billing.creator@example.com',
      designation: null,
    };
    const billingRequest = {
      id: 'billing-1',
      requesterId: 'requester-1',
      requester: null,
      createdById: 'creator-1',
      createdBy: creator,
      departmentId: 'dept-1',
      customerName: 'ACME Bangladesh Ltd.',
      customerEmail: 'billing@acme.example',
      customerAddress: 'Dhaka',
      title: 'Enterprise installation',
      description: null,
      amount: '125000',
      currency: 'BDT',
      billingCategory: 'Installation',
      status: BillingRequestStatus.DRAFT,
      workflowInstanceId: null,
      invoiceId: null,
      rejectionReason: null,
      customFieldsJson: null,
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
    const getManyAndCount = jest.fn().mockResolvedValue([[billingRequest], 1]);
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount,
    };
    const billingRequestsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn().mockResolvedValue(billingRequest),
    };
    const service = new BillingService(
      billingRequestsRepository as never,
      { allowsResubmission: jest.fn<Promise<boolean>, [string]>() } as never,
      {} as never,
    );

    const actor = {
      userId: 'requester-1',
      roles: ['sales-officer'],
      permissions: [],
    } as never;

    const listResponse = await service.list({ page: 1, limit: 10 }, actor);
    const detailResponse = await service.findOne('billing-1', actor);

    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'billingRequest.createdBy',
      'createdBy',
    );
    expect(billingRequestsRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'billing-1' },
      relations: { createdBy: true, requester: true },
    });
    expect(listResponse.items[0]).toEqual(
      expect.objectContaining({
        createdById: 'creator-1',
        createdBy: creator,
      }),
    );
    expect(detailResponse).toEqual(
      expect.objectContaining({
        createdById: 'creator-1',
        createdBy: creator,
      }),
    );
  });

  it('cancels the active workflow when an under-review billing request is cancelled', async () => {
    const billingRequest = {
      id: 'billing-1',
      requesterId: 'user-1',
      status: BillingRequestStatus.UNDER_REVIEW,
      workflowInstanceId: 'workflow-1',
      invoiceId: null,
    };
    const billingRequestsRepository = {
      findOneBy: jest.fn().mockResolvedValue(billingRequest),
      save: jest.fn().mockResolvedValue(billingRequest),
    };
    const runtime = {
      cancelActiveForEntity: jest.fn().mockResolvedValue(undefined),
    };
    const service = new BillingService(
      billingRequestsRepository as never,
      runtime as never,
      { record: jest.fn().mockResolvedValue(undefined) } as never,
    );

    await service.cancel('billing-1', {
      userId: 'user-1',
      roles: ['sales-officer'],
      permissions: [],
    } as never);

    expect(runtime.cancelActiveForEntity).toHaveBeenCalledWith({
      entityType: 'BillingRequest',
      entityId: 'billing-1',
      actorUserId: 'user-1',
    });
  });
});
