import { BadRequestException } from '@nestjs/common';
import { Paginated } from '../../common/http/paginated';
import { WorkflowTemplateService } from './workflow-template.service';
import {
  WorkflowAssigneeType,
  WorkflowStepType,
  WorkflowTemplateStatus,
} from './enums/workflow-builder.enums';

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

  it('rejects publishing a second catch-all template for the same workflow event', async () => {
    const templatesRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'tpl-2',
        moduleName: 'expenses',
        eventName: 'expense.submitted',
        entityType: 'Expense',
        triggerCondition: {
          conditionJson: { mode: 'all', conditions: [] },
        },
        rules: [
          {
            isActive: true,
            isFallback: false,
            conditionJson: {
              mode: 'all',
              conditions: [
                { field: 'currency', operator: 'eq', value: 'EURO' },
              ],
            },
            steps: [{ id: 'step-1' }],
          },
        ],
      }),
      find: jest.fn().mockResolvedValue([
        {
          id: 'tpl-1',
          moduleName: 'expenses',
          eventName: 'expense.submitted',
          entityType: 'Expense',
          status: WorkflowTemplateStatus.PUBLISHED,
          triggerCondition: {
            conditionJson: { mode: 'all', conditions: [] },
          },
        },
      ]),
      save: jest.fn(),
    };
    const service = new WorkflowTemplateService(
      templatesRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.publish('tpl-2')).rejects.toThrow(
      'A published workflow already exists for this module, event, and entity without trigger conditions. Add a trigger condition to narrow this workflow before publishing.',
    );
    expect(templatesRepository.save).not.toHaveBeenCalled();
  });

  it('runs publish validation when wizard creation requests published status', async () => {
    const template = {
      id: 'tpl-2',
      name: 'Euro expense workflow',
      moduleName: 'expenses',
      eventName: 'expense.submitted',
      entityType: 'Expense',
      status: WorkflowTemplateStatus.PUBLISHED,
      priority: 5,
      triggerCondition: {
        conditionJson: { mode: 'all', conditions: [] },
      },
      rules: [
        {
          isActive: true,
          isFallback: false,
          conditionJson: {
            mode: 'all',
            conditions: [{ field: 'currency', operator: 'eq', value: 'EURO' }],
          },
          steps: [{ id: 'step-1' }],
        },
      ],
    };
    const templatesRepository = {
      create: jest.fn((value: object) => ({ id: 'tpl-2', ...value })),
      save: jest.fn((value: object) => value),
      findOne: jest.fn().mockResolvedValue(template),
      find: jest.fn().mockResolvedValue([
        {
          id: 'tpl-1',
          moduleName: 'expenses',
          eventName: 'expense.submitted',
          entityType: 'Expense',
          status: WorkflowTemplateStatus.PUBLISHED,
          triggerCondition: {
            conditionJson: { mode: 'all', conditions: [] },
          },
        },
      ]),
    };
    const rulesRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: object) => value),
      save: jest.fn((value: object) => ({ id: 'rule-1', ...value })),
      findOneOrFail: jest.fn().mockResolvedValue({ id: 'rule-1', steps: [] }),
    };
    const stepConfigsRepository = {
      create: jest.fn((value: object) => value),
      save: jest.fn((value: object) => value),
    };
    const triggerConditionsRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: object) => value),
      save: jest.fn((value: object) => value),
    };
    const service = new WorkflowTemplateService(
      templatesRepository as never,
      triggerConditionsRepository as never,
      rulesRepository as never,
      stepConfigsRepository as never,
      {} as never,
    );

    await expect(
      service.createWizard({
        template: {
          name: 'Euro expense workflow',
          moduleName: 'expenses',
          eventName: 'expense.submitted',
          entityType: 'Expense',
          status: WorkflowTemplateStatus.PUBLISHED,
          priority: 5,
          triggerConditionJson: { mode: 'all', conditions: [] },
        },
        rules: [
          {
            name: 'Euro expense path',
            priority: 1,
            conditionJson: {
              mode: 'all',
              conditions: [
                { field: 'currency', operator: 'eq', value: 'EURO' },
              ],
            },
            steps: [
              {
                stepOrder: 1,
                stepName: 'Manager approval',
                stepType: WorkflowStepType.APPROVAL,
                assigneeType: WorkflowAssigneeType.REQUESTER_MANAGER,
              },
            ],
          },
        ],
      }),
    ).rejects.toThrow(
      'A published workflow already exists for this module, event, and entity without trigger conditions. Add a trigger condition to narrow this workflow before publishing.',
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

    expect(response).toBeInstanceOf(Paginated);
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

describe('WorkflowTemplateService step role validation', () => {
  it('rejects wizard rules with role assignee slugs that do not exist', async () => {
    const template = {
      id: 'template-1',
      moduleName: 'billing',
      eventName: 'billing.submitted',
      entityType: 'BillingRequest',
    };
    const templatesRepository = {
      create: jest.fn().mockReturnValue(template),
      save: jest.fn().mockResolvedValue(template),
      findOne: jest.fn().mockResolvedValue(template),
    };
    const rulesRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: object) => value),
      save: jest.fn((value: object) => ({ id: 'rule-1', ...value })),
      findOneOrFail: jest.fn().mockResolvedValue({ id: 'rule-1', steps: [] }),
    };
    const stepConfigsRepository = {
      create: jest.fn((value: object) => value),
      save: jest.fn((value: object) => value),
    };
    const rolesRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    const service = new WorkflowTemplateService(
      templatesRepository as never,
      {} as never,
      rulesRepository as never,
      stepConfigsRepository as never,
      {} as never,
      undefined,
      rolesRepository as never,
    );

    await expect(
      service.createWizard({
        template: {
          name: 'Billing workflow',
          moduleName: 'billing',
          eventName: 'billing.submitted',
          entityType: 'BillingRequest',
        },
        rules: [
          {
            name: 'Accounts review',
            priority: 1,
            isFallback: true,
            steps: [
              {
                stepOrder: 1,
                stepName: 'Accounts review',
                stepType: WorkflowStepType.REVIEW,
                assigneeType: WorkflowAssigneeType.ROLE,
                assigneeRoleSlug: 'accounts',
              },
            ],
          },
        ],
      }),
    ).rejects.toThrow('Workflow role accounts does not exist');
  });
});
