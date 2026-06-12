import { WorkflowRuleService } from './workflow-rule.service';
import {
  WorkflowAssigneeType,
  WorkflowStepType,
} from './enums/workflow-builder.enums';

describe('WorkflowRuleService step config', () => {
  it('creates approval steps without attachment requirement config', async () => {
    const stepConfigsRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: object) => value),
      save: jest.fn((value: object) => value),
    };
    const service = new WorkflowRuleService(
      {} as never,
      stepConfigsRepository as never,
    );

    await service.createStep('rule-1', {
      stepOrder: 1,
      stepName: 'Manager approval',
      stepType: WorkflowStepType.APPROVAL,
      assigneeType: WorkflowAssigneeType.REQUESTER_MANAGER,
    });

    expect(stepConfigsRepository.create).toHaveBeenCalledTimes(1);
    const [createdStep] = stepConfigsRepository.create.mock.calls[0] ?? [];
    expect(createdStep).not.toHaveProperty('requiresAttachment');
  });

  it('rejects role assignee slugs that do not exist when creating a step', async () => {
    const stepConfigsRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: object) => value),
      save: jest.fn((value: object) => value),
    };
    const rolesRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    const service = new WorkflowRuleService(
      {} as never,
      stepConfigsRepository as never,
      rolesRepository as never,
    );

    await expect(
      service.createStep('rule-1', {
        stepOrder: 1,
        stepName: 'Accounts review',
        stepType: WorkflowStepType.REVIEW,
        assigneeType: WorkflowAssigneeType.ROLE,
        assigneeRoleSlug: 'accounts',
      }),
    ).rejects.toThrow('Workflow role accounts does not exist');
    expect(stepConfigsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects role assignee slugs that do not exist when updating a step', async () => {
    const step = {
      id: 'step-1',
      workflowApprovalRuleId: 'rule-1',
      stepOrder: 1,
      stepName: 'Accounts review',
      stepType: WorkflowStepType.REVIEW,
      assigneeType: WorkflowAssigneeType.ROLE,
      assigneeRoleSlug: 'accounts-officer',
    };
    const stepConfigsRepository = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce(step)
        .mockResolvedValueOnce(null),
      save: jest.fn((value: object) => value),
    };
    const rolesRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    const service = new WorkflowRuleService(
      {} as never,
      stepConfigsRepository as never,
      rolesRepository as never,
    );

    await expect(
      service.updateStep('step-1', { assigneeRoleSlug: 'accounts' }),
    ).rejects.toThrow('Workflow role accounts does not exist');
    expect(stepConfigsRepository.save).not.toHaveBeenCalled();
  });
});
