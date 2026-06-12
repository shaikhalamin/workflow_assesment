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
});
