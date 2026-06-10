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
});
