import {
  WorkflowAssigneeType,
  WorkflowTemplateStatus,
  WorkflowStepType,
} from '../workflow-builder/enums/workflow-builder.enums';
import {
  WorkflowActionType,
  WorkflowInstanceStatus,
  WorkflowStepStatus,
} from './enums/workflow-runtime.enums';
import { WorkflowRuntimeService } from './workflow-runtime.service';

describe('WorkflowRuntimeService', () => {
  it('chooses the more specific matching template when matching templates share priority', async () => {
    const createdAt = new Date('2026-06-11T08:00:00.000Z');
    const catchAllStepConfig = {
      id: 'step-config-catch-all',
      stepOrder: 1,
      stepName: 'HR manager approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.USER,
      assigneeUserId: 'hr-manager-1',
      assigneeRoleSlug: null,
      assigneeFieldPath: null,
    };
    const specificStepConfig = {
      id: 'step-config-specific',
      stepOrder: 1,
      stepName: 'CFO approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.USER,
      assigneeUserId: 'cfo-1',
      assigneeRoleSlug: null,
      assigneeFieldPath: null,
    };
    const catchAllTemplate = {
      id: 'template-catch-all',
      moduleName: 'leaves',
      eventName: 'leave.submitted',
      entityType: 'LeaveRequest',
      status: WorkflowTemplateStatus.PUBLISHED,
      priority: 1,
      triggerCondition: {
        conditionJson: { mode: 'all', conditions: [] },
      },
      rules: [
        {
          id: 'rule-catch-all',
          priority: 1,
          isFallback: false,
          isActive: true,
          conditionJson: null,
          steps: [catchAllStepConfig],
        },
      ],
    };
    const specificTemplate = {
      id: 'template-specific',
      moduleName: 'leaves',
      eventName: 'leave.submitted',
      entityType: 'LeaveRequest',
      status: WorkflowTemplateStatus.PUBLISHED,
      priority: 1,
      triggerCondition: {
        conditionJson: {
          mode: 'all',
          conditions: [{ field: 'leaveDays', operator: 'gte', value: 3 }],
        },
      },
      rules: [
        {
          id: 'rule-specific',
          priority: 1,
          isFallback: false,
          isActive: true,
          conditionJson: null,
          steps: [specificStepConfig],
        },
      ],
    };
    const instance = {
      id: 'workflow-1',
      workflowTemplateId: 'template-specific',
      workflowApprovalRuleId: 'rule-specific',
      moduleName: 'leaves',
      eventName: 'leave.submitted',
      entityType: 'LeaveRequest',
      entityId: 'leave-1',
      requesterId: 'requester-1',
      departmentId: null,
      status: WorkflowInstanceStatus.ACTIVE,
      metadataJson: { leaveDays: 5 },
      startedAt: createdAt,
    };
    const step = {
      id: 'step-1',
      workflowInstanceId: 'workflow-1',
      stepOrder: 1,
      stepName: 'CFO approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.USER,
      assignedUserId: 'cfo-1',
      assignedRoleSlug: null,
      status: WorkflowStepStatus.WAITING,
      activatedAt: null,
      actedAt: null,
      actionByUserId: null,
      actionByUser: null,
      comment: null,
      rejectionReason: null,
      actions: [],
      createdAt,
      updatedAt: createdAt,
    };
    const templatesRepository = {
      find: jest.fn().mockResolvedValue([catchAllTemplate, specificTemplate]),
    };
    const instancesRepository = {
      create: jest.fn().mockReturnValue(instance),
      save: jest.fn().mockResolvedValue(instance),
    };
    const stepsRepository = {
      create: jest.fn().mockReturnValue(step),
      save: jest.fn((value: typeof step) => Promise.resolve(value)),
    };
    const actionsRepository = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
    };
    const auditLogsRepository = {};
    const notificationsRepository = {};
    const manager = {
      getRepository: jest.fn((entity: { name: string }) => {
        if (entity.name === 'WorkflowTemplate') return templatesRepository;
        if (entity.name === 'WorkflowInstance') return instancesRepository;
        if (entity.name === 'WorkflowStep') return stepsRepository;
        if (entity.name === 'WorkflowAction') return actionsRepository;
        if (entity.name === 'AuditLog') return auditLogsRepository;
        if (entity.name === 'Notification') return notificationsRepository;
        return {};
      }),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) =>
        callback(manager),
      ),
    };
    const ruleEngine = {
      matches: jest.fn().mockReturnValue(true),
    };
    const assigneeResolver = {
      resolve: jest.fn().mockResolvedValue({
        assignedUserId: 'cfo-1',
        assignedRoleSlug: null,
      }),
    };
    const auditLogsService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const notificationsService = {
      createTaskAssigned: jest.fn().mockResolvedValue(undefined),
    };
    const service = new WorkflowRuntimeService(
      templatesRepository as never,
      instancesRepository as never,
      stepsRepository as never,
      actionsRepository as never,
      ruleEngine as never,
      assigneeResolver as never,
      {} as never,
      {} as never,
      auditLogsService as never,
      notificationsService as never,
      dataSource as never,
    );

    await service.trigger({
      moduleName: 'leaves',
      eventName: 'leave.submitted',
      entityType: 'LeaveRequest',
      entityId: 'leave-1',
      requesterId: 'requester-1',
      departmentId: null,
      metadata: { leaveDays: 5 },
    });

    expect(instancesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowTemplateId: 'template-specific',
        workflowApprovalRuleId: 'rule-specific',
      }),
    );
    expect(assigneeResolver.resolve).toHaveBeenCalledWith(
      specificStepConfig,
      expect.objectContaining({
        requesterId: 'requester-1',
        metadata: { leaveDays: 5 },
      }),
    );
  });

  it('returns pending approval tasks with request summary details', async () => {
    const createdAt = new Date('2026-06-11T08:00:00.000Z');
    const requester = {
      id: 'requester-1',
      name: 'Expense Requester',
      email: 'requester@example.com',
      designation: null,
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
    const requester = {
      id: 'requester-1',
      name: 'Expense Requester',
      email: 'requester@example.com',
      designation: 'Analyst',
      employeeCode: 'REQ-1',
    };
    const manager = {
      id: 'manager-1',
      name: 'Line Manager',
      email: 'manager@example.com',
      designation: 'Manager',
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
        requester,
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
      {} as never,
    );

    const response = await service.findOne('workflow-1');

    expect(instancesRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'workflow-1' },
      relations: {
        actions: { actorUser: true },
        requester: true,
        steps: {
          actionByUser: true,
          actions: { actorUser: true },
          assignedUser: true,
        },
      },
    });
    expect(response.requester).toEqual({
      id: 'requester-1',
      name: 'Expense Requester',
      email: 'requester@example.com',
      designation: 'Analyst',
    });
    expect(response.steps[0]?.assignedUser).toEqual({
      id: 'manager-1',
      name: 'Line Manager',
      email: 'manager@example.com',
      designation: 'Manager',
    });
    expect(response.steps[0]?.actionByUser).toEqual({
      id: 'manager-1',
      name: 'Line Manager',
      email: 'manager@example.com',
      designation: 'Manager',
    });
    expect(response.steps[0]?.actions[0]?.actorUser).toEqual({
      id: 'manager-1',
      name: 'Line Manager',
      email: 'manager@example.com',
      designation: 'Manager',
    });
    expect(response.actions[0]?.actorUser).toEqual({
      id: 'manager-1',
      name: 'Line Manager',
      email: 'manager@example.com',
      designation: 'Manager',
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
      {} as never,
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
    expect(notificationsService.createWorkflowApproved).toHaveBeenCalledWith({
      recipientUserId: 'requester-1',
      entityType: 'Expense',
      entityId: 'expense-1',
      workflowInstanceId: 'workflow-1',
      channels: { push: true, email: true },
    });
  });

  it('sends push and email channels when activating the next approval step', async () => {
    const createdAt = new Date('2026-06-11T08:00:00.000Z');
    const step = {
      id: 'step-1',
      workflowInstanceId: 'workflow-1',
      assignedUserId: 'manager-1',
      assignedRoleSlug: null,
      status: WorkflowStepStatus.ACTIVE,
      actedAt: null,
      actionByUserId: null,
      comment: null,
      rejectionReason: null,
      actions: [],
      createdAt,
      updatedAt: createdAt,
    };
    const nextStep = {
      id: 'step-2',
      workflowInstanceId: 'workflow-1',
      assignedUserId: null,
      assignedRoleSlug: 'finance-manager',
      status: WorkflowStepStatus.WAITING,
      activatedAt: null,
      actions: [],
      createdAt,
      updatedAt: createdAt,
    };
    const instance = {
      id: 'workflow-1',
      entityType: 'Expense',
      entityId: 'expense-1',
      status: WorkflowInstanceStatus.ACTIVE,
    };
    const instancesRepository = {
      findOneByOrFail: jest.fn().mockResolvedValue(instance),
    };
    const stepsRepository = {
      findOneBy: jest.fn().mockResolvedValue(step),
      save: jest.fn((value: typeof step | typeof nextStep) =>
        Promise.resolve(value),
      ),
      findOne: jest.fn().mockResolvedValue(nextStep),
    };
    const actionsRepository = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
    };
    const auditLogsService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const notificationsService = {
      createTaskAssigned: jest.fn().mockResolvedValue(undefined),
    };
    const service = new WorkflowRuntimeService(
      {} as never,
      instancesRepository as never,
      stepsRepository as never,
      actionsRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      auditLogsService as never,
      notificationsService as never,
      {} as never,
    );

    await service.approveStep(
      'step-1',
      { userId: 'manager-1', roles: [] } as Express.User,
      {},
    );

    expect(notificationsService.createTaskAssigned).toHaveBeenCalledWith({
      assignedUserId: null,
      assignedRoleSlug: 'finance-manager',
      entityType: 'Expense',
      entityId: 'expense-1',
      workflowInstanceId: 'workflow-1',
      channels: { push: true, email: true },
    });
  });

  it('sends push and email channels when a workflow is rejected', async () => {
    const createdAt = new Date('2026-06-11T08:00:00.000Z');
    const step = {
      id: 'step-1',
      workflowInstanceId: 'workflow-1',
      stepOrder: 1,
      stepName: 'Manager approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.USER,
      assignedUserId: 'manager-1',
      assignedRoleSlug: null,
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
      entityType: 'Expense',
      entityId: 'expense-1',
      requesterId: 'requester-1',
      status: WorkflowInstanceStatus.ACTIVE,
      rejectedAt: null,
    };
    const instancesRepository = {
      findOneByOrFail: jest.fn().mockResolvedValue(instance),
      save: jest.fn((value: typeof instance) => Promise.resolve(value)),
    };
    const stepsRepository = {
      findOneBy: jest.fn().mockResolvedValue(step),
      save: jest.fn((value: typeof step) => Promise.resolve(value)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const actionsRepository = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
    };
    const outcomeHandler = {
      handleRejected: jest.fn().mockResolvedValue(undefined),
    };
    const auditLogsService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const notificationsService = {
      createWorkflowRejected: jest.fn().mockResolvedValue(undefined),
    };
    const service = new WorkflowRuntimeService(
      {} as never,
      instancesRepository as never,
      stepsRepository as never,
      actionsRepository as never,
      {} as never,
      {} as never,
      outcomeHandler as never,
      {} as never,
      auditLogsService as never,
      notificationsService as never,
      {} as never,
    );

    await service.rejectStep(
      'step-1',
      { userId: 'manager-1', roles: [] } as Express.User,
      { reason: 'Policy mismatch' },
    );

    expect(notificationsService.createWorkflowRejected).toHaveBeenCalledWith({
      recipientUserId: 'requester-1',
      entityType: 'Expense',
      entityId: 'expense-1',
      workflowInstanceId: 'workflow-1',
      channels: { push: true, email: true },
    });
  });

  it('cancels an active workflow instance and skips unfinished steps for an entity', async () => {
    const instance = {
      id: 'workflow-1',
      entityType: 'BillingRequest',
      entityId: 'billing-1',
      status: WorkflowInstanceStatus.ACTIVE,
      completedAt: null,
    };
    const instancesRepository = {
      findOneBy: jest.fn().mockResolvedValue(instance),
      save: jest.fn().mockResolvedValue(instance),
    };
    const stepsRepository = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const actionsRepository = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
    };
    const auditLogsService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const service = new WorkflowRuntimeService(
      {} as never,
      instancesRepository as never,
      stepsRepository as never,
      actionsRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      auditLogsService as never,
      {} as never,
      {} as never,
    );

    await service.cancelActiveForEntity({
      entityType: 'BillingRequest',
      entityId: 'billing-1',
      actorUserId: 'user-1',
    });

    expect(instance.status).toBe(WorkflowInstanceStatus.CANCELLED);
    expect(instance.completedAt).toBeInstanceOf(Date);
    expect(stepsRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowInstanceId: 'workflow-1',
      }),
      expect.objectContaining({
        status: WorkflowStepStatus.SKIPPED,
        actionByUserId: 'user-1',
      }),
    );
    expect(actionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowInstanceId: 'workflow-1',
        action: WorkflowActionType.CANCELLED,
        actorUserId: 'user-1',
      }),
    );
    expect(auditLogsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'WORKFLOW_CANCELLED',
        oldStatus: WorkflowInstanceStatus.ACTIVE,
        newStatus: WorkflowInstanceStatus.CANCELLED,
      }),
    );
  });

  it('runs trigger writes in a transaction so failed assignee resolution rolls back partial instance', async () => {
    const stepConfig = {
      id: 'step-config-1',
      stepOrder: 1,
      stepName: 'Manager approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.REQUESTER_MANAGER,
      assigneeUserId: null,
      assigneeRoleSlug: null,
      assigneeFieldPath: null,
    };
    const template = {
      id: 'template-1',
      moduleName: 'expenses',
      eventName: 'expense.submitted',
      entityType: 'Expense',
      status: WorkflowTemplateStatus.PUBLISHED,
      triggerCondition: null,
      rules: [
        {
          id: 'rule-1',
          priority: 1,
          isFallback: false,
          isActive: true,
          conditionJson: null,
          steps: [stepConfig],
        },
      ],
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
      metadataJson: { amount: 2500 },
      startedAt: new Date('2026-06-11T08:00:00.000Z'),
    };
    const templatesRepository = {
      find: jest.fn().mockResolvedValue([template]),
    };
    const instancesRepository = {
      create: jest.fn().mockReturnValue(instance),
      save: jest.fn().mockResolvedValue(instance),
    };
    const stepsRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    const actionsRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    const manager = {
      getRepository: jest.fn((entity: { name: string }) => {
        if (entity.name === 'WorkflowTemplate') return templatesRepository;
        if (entity.name === 'WorkflowInstance') return instancesRepository;
        if (entity.name === 'WorkflowStep') return stepsRepository;
        if (entity.name === 'WorkflowAction') return actionsRepository;
        return {};
      }),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) =>
        callback(manager),
      ),
    };
    const ruleEngine = {
      matches: jest.fn().mockReturnValue(true),
    };
    const assigneeResolver = {
      resolve: jest
        .fn()
        .mockRejectedValue(new Error('Workflow step has no concrete assignee')),
    };
    const auditLogsService = {
      record: jest.fn(),
    };
    const notificationsService = {
      createTaskAssigned: jest.fn(),
    };
    const service = new WorkflowRuntimeService(
      templatesRepository as never,
      instancesRepository as never,
      stepsRepository as never,
      actionsRepository as never,
      ruleEngine as never,
      assigneeResolver as never,
      {} as never,
      {} as never,
      auditLogsService as never,
      notificationsService as never,
      dataSource as never,
    );

    await expect(
      service.trigger({
        moduleName: 'expenses',
        eventName: 'expense.submitted',
        entityType: 'Expense',
        entityId: 'expense-1',
        requesterId: 'requester-1',
        departmentId: null,
        metadata: { amount: 2500 },
      }),
    ).rejects.toThrow('Workflow step has no concrete assignee');

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(instancesRepository.save).toHaveBeenCalledWith(instance);
    expect(stepsRepository.save).not.toHaveBeenCalled();
    expect(actionsRepository.save).not.toHaveBeenCalled();
    expect(auditLogsService.record).not.toHaveBeenCalled();
    expect(notificationsService.createTaskAssigned).not.toHaveBeenCalled();
  });

  it('sends push and email channels when the initial workflow task is assigned', async () => {
    const createdAt = new Date('2026-06-11T08:00:00.000Z');
    const stepConfig = {
      id: 'step-config-1',
      stepOrder: 1,
      stepName: 'Manager approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.USER,
      assigneeUserId: 'manager-1',
      assigneeRoleSlug: null,
      assigneeFieldPath: null,
    };
    const template = {
      id: 'template-1',
      moduleName: 'expenses',
      eventName: 'expense.submitted',
      entityType: 'Expense',
      status: WorkflowTemplateStatus.PUBLISHED,
      triggerCondition: null,
      rules: [
        {
          id: 'rule-1',
          priority: 1,
          isFallback: false,
          isActive: true,
          conditionJson: null,
          steps: [stepConfig],
        },
      ],
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
      metadataJson: { amount: 2500 },
      startedAt: createdAt,
    };
    const step = {
      id: 'step-1',
      workflowInstanceId: 'workflow-1',
      stepOrder: 1,
      stepName: 'Manager approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.USER,
      assignedUserId: 'manager-1',
      assignedRoleSlug: null,
      status: WorkflowStepStatus.WAITING,
      activatedAt: null,
      actedAt: null,
      actionByUserId: null,
      actionByUser: null,
      comment: null,
      rejectionReason: null,
      actions: [],
      createdAt,
      updatedAt: createdAt,
    };
    const templatesRepository = {
      find: jest.fn().mockResolvedValue([template]),
    };
    const instancesRepository = {
      create: jest.fn().mockReturnValue(instance),
      save: jest.fn().mockResolvedValue(instance),
    };
    const stepsRepository = {
      create: jest.fn().mockReturnValue(step),
      save: jest.fn((value: typeof step) => Promise.resolve(value)),
    };
    const actionsRepository = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
    };
    const auditLogsRepository = {};
    const notificationsRepository = {};
    const manager = {
      getRepository: jest.fn((entity: { name: string }) => {
        if (entity.name === 'WorkflowTemplate') return templatesRepository;
        if (entity.name === 'WorkflowInstance') return instancesRepository;
        if (entity.name === 'WorkflowStep') return stepsRepository;
        if (entity.name === 'WorkflowAction') return actionsRepository;
        if (entity.name === 'AuditLog') return auditLogsRepository;
        if (entity.name === 'Notification') return notificationsRepository;
        return {};
      }),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => unknown) =>
        callback(manager),
      ),
    };
    const ruleEngine = {
      matches: jest.fn().mockReturnValue(true),
    };
    const assigneeResolver = {
      resolve: jest.fn().mockResolvedValue({
        assignedUserId: 'manager-1',
        assignedRoleSlug: null,
      }),
    };
    const auditLogsService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const notificationsService = {
      createTaskAssigned: jest.fn().mockResolvedValue(undefined),
    };
    const service = new WorkflowRuntimeService(
      templatesRepository as never,
      instancesRepository as never,
      stepsRepository as never,
      actionsRepository as never,
      ruleEngine as never,
      assigneeResolver as never,
      {} as never,
      {} as never,
      auditLogsService as never,
      notificationsService as never,
      dataSource as never,
    );

    await service.trigger({
      moduleName: 'expenses',
      eventName: 'expense.submitted',
      entityType: 'Expense',
      entityId: 'expense-1',
      requesterId: 'requester-1',
      departmentId: null,
      metadata: { amount: 2500 },
    });

    expect(notificationsService.createTaskAssigned).toHaveBeenCalledWith(
      {
        assignedUserId: 'manager-1',
        assignedRoleSlug: null,
        entityType: 'Expense',
        entityId: 'expense-1',
        workflowInstanceId: 'workflow-1',
        channels: { push: true, email: true },
      },
      notificationsRepository,
    );
  });
});
