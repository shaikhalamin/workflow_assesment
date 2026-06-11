import { BadRequestException } from '@nestjs/common';
import { WorkflowTemplateService } from './workflow-template.service';

describe('WorkflowTemplateService publish validation', () => {
  it('rejects publishing templates without active rules', async () => {
    const service = new WorkflowTemplateService(
      {
        findOne: jest.fn().mockResolvedValue({ id: 'tpl-1', rules: [] }),
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.publish('tpl-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('WorkflowTemplateService workflow instance association', () => {
  it('adds workflow instance counts when listing templates', async () => {
    const template = { id: 'template-1', name: 'Expense workflow' };
    const templatesRepository = {
      findAndCount: jest.fn().mockResolvedValue([[template], 1]),
    };
    const workflowInstancesRepository = {
      count: jest.fn().mockResolvedValue(2),
    };
    const service = new WorkflowTemplateService(
      templatesRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      workflowInstancesRepository as never,
    );

    const response = await service.list({ page: 1, limit: 25 });

    expect(response.items[0]).toEqual({
      ...template,
      workflowInstanceCount: 2,
    });
    expect(workflowInstancesRepository.count).toHaveBeenCalledWith({
      where: { workflowTemplateId: 'template-1' },
    });
  });

  it('rejects deactivation when the workflow is associated with an instance', async () => {
    const template = { id: 'template-1', rules: [] };
    const templatesRepository = {
      findOne: jest.fn().mockResolvedValue(template),
      save: jest.fn(),
    };
    const workflowInstancesRepository = {
      count: jest.fn().mockResolvedValue(1),
    };
    const service = new WorkflowTemplateService(
      templatesRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      workflowInstancesRepository as never,
    );

    await expect(service.deactivate('template-1')).rejects.toThrow(
      'Workflow already associated can not deactivate',
    );
    expect(templatesRepository.save).not.toHaveBeenCalled();
  });
});

describe('WorkflowTemplateService outcomes', () => {
  it('removes payment request actions when loading a leave workflow', async () => {
    const template = {
      id: 'template-1',
      moduleName: 'leaves',
      eventName: 'leave.submitted',
      entityType: 'LeaveRequest',
      outcomeConfig: {
        approvedActionsJson: {
          setStatus: 'APPROVED',
          createPaymentRequest: true,
        },
      },
    };
    const templatesRepository = {
      findOne: jest.fn().mockResolvedValue(template),
    };
    const service = new WorkflowTemplateService(
      templatesRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const response = await service.findOne('template-1');

    expect(response.outcomeConfig?.approvedActionsJson).toEqual({
      setStatus: 'APPROVED',
    });
  });

  it('removes payment request actions when saving a leave workflow', async () => {
    const template = {
      id: 'template-1',
      moduleName: 'leaves',
      eventName: 'leave.submitted',
      entityType: 'LeaveRequest',
    };
    const templatesRepository = {
      create: jest.fn().mockReturnValue(template),
      save: jest.fn().mockResolvedValue(template),
      findOne: jest.fn().mockResolvedValue(template),
    };
    const triggerConditionsRepository = {};
    const rulesRepository = {};
    const stepConfigsRepository = {};
    const outcomeConfigsRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: unknown) => value),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const service = new WorkflowTemplateService(
      templatesRepository as never,
      triggerConditionsRepository as never,
      rulesRepository as never,
      stepConfigsRepository as never,
      outcomeConfigsRepository as never,
    );

    await service.create({
      name: 'Leave workflow',
      moduleName: 'leaves',
      eventName: 'leave.submitted',
      entityType: 'LeaveRequest',
      approvedActionsJson: {
        setStatus: 'APPROVED',
        createPaymentRequest: true,
      },
    });

    expect(outcomeConfigsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowTemplateId: 'template-1',
        approvedActionsJson: {
          setStatus: 'APPROVED',
        },
        rejectedActionsJson: null,
      }),
    );
  });
});
