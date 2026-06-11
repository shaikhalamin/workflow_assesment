import {
  WorkflowAssigneeType,
  WorkflowStepType,
} from '../workflow-builder/enums/workflow-builder.enums';
import {
  WorkflowActionType,
  WorkflowInstanceStatus,
  WorkflowStepStatus,
} from './enums/workflow-runtime.enums';
import { WorkflowRuntimeService } from './workflow-runtime.service';

describe('WorkflowRuntimeService', () => {
  it('returns pending approval tasks with request summary details', async () => {
    const createdAt = new Date('2026-06-11T08:00:00.000Z');
    const requester = {
      id: 'requester-1',
      name: 'Expense Requester',
      email: 'requester@example.com',
    };
    const queryBuilder = {
      innerJoinAndSelect: jest.fn(),
      leftJoinAndSelect: jest.fn(),
      leftJoinAndMapOne: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'step-1',
          workflowInstanceId: 'workflow-1',
          workflowInstance: {
            id: 'workflow-1',
            entityType: 'Expense',
            entityId: 'expense-1',
            requesterId: requester.id,
            requester,
            metadataJson: {
              title: 'Laptop charger reimbursement',
              amount: 4500,
              currency: 'BDT',
            },
            createdAt,
          },
          stepOrder: 1,
          stepName: 'Manager approval',
          stepType: WorkflowStepType.APPROVAL,
          assignedUserId: 'manager-1',
          assignedUser: null,
          assignedRoleSlug: null,
          assigneeType: WorkflowAssigneeType.USER,
          status: WorkflowStepStatus.ACTIVE,
          activatedAt: createdAt,
          actedAt: null,
          actionByUserId: null,
          actionByUser: null,
          comment: null,
          rejectionReason: null,
          actions: [],
          createdAt,
          updatedAt: createdAt,
        },
      ]),
    };
    queryBuilder.innerJoinAndSelect.mockReturnValue(queryBuilder);
    queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
    queryBuilder.leftJoinAndMapOne.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    const stepsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const service = new WorkflowRuntimeService(
      {} as never,
      {} as never,
      stepsRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const response = await service.myPending({
      userId: 'manager-1',
      roles: [],
    } as Express.User);

    expect(response[0]?.request).toEqual({
      title: 'Laptop charger reimbursement',
      type: 'Expense',
      requesterId: 'requester-1',
      requester,
      amount: 4500,
      currency: 'BDT',
      leaveDays: null,
      createdAt: '2026-06-11T08:00:00.000Z',
    });
  });

  it('uses the expense request title when old workflow metadata has no title', async () => {
    const createdAt = new Date('2026-06-11T08:00:00.000Z');
    const queryBuilder = {
      innerJoinAndSelect: jest.fn(),
      leftJoinAndSelect: jest.fn(),
      leftJoinAndMapOne: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'step-1',
          workflowInstanceId: 'workflow-1',
          workflowInstance: {
            id: 'workflow-1',
            entityType: 'Expense',
            entityId: '78077d9b-831d-421c-8015-ab70f8332084',
            requesterId: 'requester-1',
            requester: null,
            expenseRequest: {
              title: 'Travel expense monthly',
            },
            metadataJson: {
              amount: 3500,
              vendor: 'Pathao',
              category: 'Travel',
              currency: 'BDT',
            },
            createdAt,
          },
          stepOrder: 1,
          stepName: 'Manager approval',
          stepType: WorkflowStepType.APPROVAL,
          assignedUserId: 'manager-1',
          assignedUser: null,
          assignedRoleSlug: null,
          assigneeType: WorkflowAssigneeType.USER,
          status: WorkflowStepStatus.ACTIVE,
          activatedAt: createdAt,
          actedAt: null,
          actionByUserId: null,
          actionByUser: null,
          comment: null,
          rejectionReason: null,
          actions: [],
          createdAt,
          updatedAt: createdAt,
        },
      ]),
    };
    queryBuilder.innerJoinAndSelect.mockReturnValue(queryBuilder);
    queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
    queryBuilder.leftJoinAndMapOne.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    const stepsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const service = new WorkflowRuntimeService(
      {} as never,
      {} as never,
      stepsRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const response = await service.myPending({
      userId: 'manager-1',
      roles: [],
    } as Express.User);

    expect(response[0]?.request?.title).toBe('Travel expense monthly');
  });

  it('uses a PostgreSQL-safe alias when joining generic workflow entity ids', async () => {
    const queryBuilder = {
      innerJoinAndSelect: jest.fn(),
      leftJoinAndSelect: jest.fn(),
      leftJoinAndMapOne: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    queryBuilder.innerJoinAndSelect.mockReturnValue(queryBuilder);
    queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
    queryBuilder.leftJoinAndMapOne.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    const stepsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const service = new WorkflowRuntimeService(
      {} as never,
      {} as never,
      stepsRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.myPending({
      userId: 'manager-1',
      roles: [],
    } as Express.User);

    expect(queryBuilder.leftJoinAndMapOne).toHaveBeenCalledWith(
      'instance.expenseRequest',
      expect.any(Function),
      'expense_request',
      'instance.entityType = :expenseEntityType AND instance.entityId = expense_request.id::text',
      { expenseEntityType: 'Expense' },
    );
  });

  it('loads workflow instance user relations for approver display', async () => {
    const createdAt = new Date('2026-06-11T08:00:00.000Z');
    const manager = {
      id: 'manager-1',
      name: 'Line Manager',
      email: 'manager@example.com',
      employeeCode: 'MGR-1',
    };
    const instancesRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'workflow-1',
        workflowTemplateId: 'template-1',
        workflowApprovalRuleId: 'rule-1',
        moduleName: 'expenses',
        eventName: 'expense.submitted',
        entityType: 'Expense',
        entityId: 'expense-1',
        requesterId: 'requester-1',
        departmentId: null,
        status: WorkflowInstanceStatus.ACTIVE,
        metadataJson: null,
        startedAt: createdAt,
        completedAt: null,
        rejectedAt: null,
        steps: [
          {
            id: 'step-1',
            workflowInstanceId: 'workflow-1',
            stepOrder: 1,
            stepName: 'Manager review',
            stepType: WorkflowStepType.APPROVAL,
            assignedUserId: 'manager-1',
            assignedUser: manager,
            assignedRoleSlug: null,
            assigneeType: WorkflowAssigneeType.USER,
            status: WorkflowStepStatus.APPROVED,
            activatedAt: createdAt,
            actedAt: createdAt,
            actionByUserId: 'manager-1',
            actionByUser: manager,
            comment: 'Approved',
            rejectionReason: null,
            actions: [
              {
                id: 'action-1',
                workflowInstanceId: 'workflow-1',
                workflowStepId: 'step-1',
                action: WorkflowActionType.APPROVED,
                actorUserId: 'manager-1',
                actorUser: manager,
                comment: 'Approved',
                reason: null,
                metadataJson: null,
                createdAt,
              },
            ],
            createdAt,
            updatedAt: createdAt,
          },
        ],
        actions: [
          {
            id: 'action-2',
            workflowInstanceId: 'workflow-1',
            workflowStepId: null,
            action: WorkflowActionType.TRIGGERED,
            actorUserId: 'manager-1',
            actorUser: manager,
            comment: null,
            reason: null,
            metadataJson: null,
            createdAt,
          },
        ],
        createdAt,
        updatedAt: createdAt,
      }),
    };
    const service = new WorkflowRuntimeService(
      {} as never,
      instancesRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const response = await service.findOne('workflow-1');

    expect(instancesRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'workflow-1' },
      relations: {
        actions: { actorUser: true },
        steps: {
          actionByUser: true,
          actions: { actorUser: true },
          assignedUser: true,
        },
      },
    });
    expect(response.steps[0]?.assignedUser).toEqual({
      id: 'manager-1',
      name: 'Line Manager',
      email: 'manager@example.com',
    });
    expect(response.steps[0]?.actionByUser).toEqual({
      id: 'manager-1',
      name: 'Line Manager',
      email: 'manager@example.com',
    });
    expect(response.steps[0]?.actions[0]?.actorUser).toEqual({
      id: 'manager-1',
      name: 'Line Manager',
      email: 'manager@example.com',
    });
    expect(response.actions[0]?.actorUser).toEqual({
      id: 'manager-1',
      name: 'Line Manager',
      email: 'manager@example.com',
    });
  });

  it('passes approved outcome actions to the handler when final approval completes', async () => {
    const createdAt = new Date('2026-06-11T08:00:00.000Z');
    const step = {
      id: 'step-1',
      workflowInstanceId: 'workflow-1',
      stepOrder: 1,
      stepName: 'Manager approval',
      stepType: WorkflowStepType.APPROVAL,
      assignedUserId: 'manager-1',
      assignedRoleSlug: null,
      assigneeType: WorkflowAssigneeType.USER,
      status: WorkflowStepStatus.ACTIVE,
      activatedAt: createdAt,
      actedAt: null,
      actionByUserId: null,
      actionByUser: null,
      comment: null,
      rejectionReason: null,
      actions: [],
      createdAt,
      updatedAt: createdAt,
    };
    const instance = {
      id: 'workflow-1',
      workflowTemplateId: 'template-1',
      workflowApprovalRuleId: 'rule-1',
      moduleName: 'expenses',
      eventName: 'expense.submitted',
      entityType: 'Expense',
      entityId: 'expense-1',
      requesterId: 'requester-1',
      departmentId: null,
      status: WorkflowInstanceStatus.ACTIVE,
      metadataJson: null,
      startedAt: createdAt,
      completedAt: null,
      rejectedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
    const templatesRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'template-1',
        outcomeConfig: {
          approvedActionsJson: { createPaymentRequest: false },
        },
      }),
    };
    const instancesRepository = {
      findOneByOrFail: jest.fn().mockResolvedValue(instance),
      save: jest.fn().mockResolvedValue(instance),
    };
    const stepsRepository = {
      findOneBy: jest.fn().mockResolvedValue(step),
      save: jest.fn().mockResolvedValue(step),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const actionsRepository = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
    };
    const outcomeHandler = {
      handleApproved: jest.fn().mockResolvedValue(undefined),
    };
    const auditLogsService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const notificationsService = {
      createWorkflowApproved: jest.fn().mockResolvedValue(undefined),
    };
    const service = new WorkflowRuntimeService(
      templatesRepository as never,
      instancesRepository as never,
      stepsRepository as never,
      actionsRepository as never,
      {} as never,
      {} as never,
      outcomeHandler as never,
      {} as never,
      auditLogsService as never,
      notificationsService as never,
    );

    await service.approveStep(
      'step-1',
      { userId: 'manager-1', roles: [] } as Express.User,
      {},
    );

    expect(templatesRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'template-1' },
      relations: { outcomeConfig: true },
    });
    expect(outcomeHandler.handleApproved).toHaveBeenCalledWith(instance, {
      createPaymentRequest: false,
    });
  });
});
