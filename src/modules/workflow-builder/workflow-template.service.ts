import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated } from '../../common/http/paginated';
import { paginateRepo } from '../../common/http/paginate';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { Role } from '../rbac/entities/role.entity';
import { WorkflowInstance } from '../workflow-runtime/entities/workflow-instance.entity';
import { CreateWorkflowRuleDto } from './dto/create-workflow-rule.dto';
import { CreateWorkflowTemplateDto } from './dto/create-workflow-template.dto';
import { UpdateWorkflowTemplateDto } from './dto/update-workflow-template.dto';
import { WorkflowWizardDto } from './dto/workflow-wizard.dto';
import { WorkflowApprovalRule } from './entities/workflow-approval-rule.entity';
import { WorkflowApprovalStepConfig } from './entities/workflow-approval-step-config.entity';
import { WorkflowOutcomeConfig } from './entities/workflow-outcome-config.entity';
import { WorkflowTemplate } from './entities/workflow-template.entity';
import { WorkflowTriggerCondition } from './entities/workflow-trigger-condition.entity';
import {
  WorkflowAssigneeType,
  WorkflowTemplateStatus,
} from './enums/workflow-builder.enums';

@Injectable()
export class WorkflowTemplateService {
  constructor(
    @InjectRepository(WorkflowTemplate)
    private readonly templatesRepository: Repository<WorkflowTemplate>,
    @InjectRepository(WorkflowTriggerCondition)
    private readonly triggerConditionsRepository: Repository<WorkflowTriggerCondition>,
    @InjectRepository(WorkflowApprovalRule)
    private readonly rulesRepository: Repository<WorkflowApprovalRule>,
    @InjectRepository(WorkflowApprovalStepConfig)
    private readonly stepConfigsRepository: Repository<WorkflowApprovalStepConfig>,
    @InjectRepository(WorkflowOutcomeConfig)
    private readonly outcomeConfigsRepository: Repository<WorkflowOutcomeConfig>,
    @InjectRepository(WorkflowInstance)
    private readonly workflowInstancesRepository?: Repository<WorkflowInstance>,
    @InjectRepository(Role)
    private readonly rolesRepository?: Repository<Role>,
  ) {}

  async list(query: PaginationQueryDto) {
    const response = await paginateRepo(this.templatesRepository, {
      page: query.page ?? 1,
      limit: query.limit ?? 25,
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
    const items = await Promise.all(
      response.items.map(async (template) => ({
        ...template,
        workflowInstanceCount: await this.countWorkflowInstances(template.id),
      })),
    );
    return new Paginated(items, response.page, response.limit, response.total);
  }

  async findOne(id: string): Promise<WorkflowTemplate> {
    const template = await this.templatesRepository.findOne({
      where: { id },
      relations: {
        triggerCondition: true,
        rules: { steps: true },
        outcomeConfig: true,
      },
      order: { rules: { priority: 'DESC', steps: { stepOrder: 'ASC' } } },
    });
    if (!template) throw new NotFoundException('Workflow template not found');
    this.sanitizeTemplateOutcome(template);
    return template;
  }

  async create(dto: CreateWorkflowTemplateDto): Promise<WorkflowTemplate> {
    const template = await this.templatesRepository.save(
      this.templatesRepository.create({
        name: dto.name,
        description: dto.description ?? null,
        moduleName: dto.moduleName,
        eventName: dto.eventName,
        entityType: dto.entityType,
        status: dto.status ?? WorkflowTemplateStatus.DRAFT,
        priority: dto.priority ?? 0,
        effectiveFrom: dto.effectiveFrom ?? null,
        effectiveTo: dto.effectiveTo ?? null,
        allowResubmission: dto.allowResubmission ?? true,
        createdById: dto.createdById ?? null,
      }),
    );
    await this.saveTemplateChildren(template.id, dto);
    return this.findOne(template.id);
  }

  async createWizard(dto: WorkflowWizardDto): Promise<WorkflowTemplate> {
    const template = await this.create({
      ...dto.template,
      approvedActionsJson:
        dto.approvedActionsJson ?? dto.template.approvedActionsJson ?? null,
      rejectedActionsJson:
        dto.rejectedActionsJson ?? dto.template.rejectedActionsJson ?? null,
    });
    for (const rule of dto.rules ?? []) {
      await this.createRule(template.id, rule);
    }
    return this.findOne(template.id);
  }

  async update(
    id: string,
    dto: UpdateWorkflowTemplateDto,
  ): Promise<WorkflowTemplate> {
    const template = await this.findOne(id);
    Object.assign(template, {
      name: dto.name ?? template.name,
      description: dto.description ?? template.description,
      moduleName: dto.moduleName ?? template.moduleName,
      eventName: dto.eventName ?? template.eventName,
      entityType: dto.entityType ?? template.entityType,
      status: dto.status ?? template.status,
      priority: dto.priority ?? template.priority,
      effectiveFrom: dto.effectiveFrom ?? template.effectiveFrom,
      effectiveTo: dto.effectiveTo ?? template.effectiveTo,
      allowResubmission: dto.allowResubmission ?? template.allowResubmission,
      createdById: dto.createdById ?? template.createdById,
    });
    await this.templatesRepository.save(template);
    await this.saveTemplateChildren(id, {
      ...dto,
      moduleName: template.moduleName,
      entityType: template.entityType,
    });
    return this.findOne(id);
  }

  async publish(id: string): Promise<WorkflowTemplate> {
    const template = await this.findOne(id);
    const activeRules = (template.rules ?? []).filter((rule) => rule.isActive);

    if (!activeRules.length) {
      throw new BadRequestException('Published workflows require active rules');
    }
    for (const rule of activeRules) {
      if (!rule.steps?.length) {
        throw new BadRequestException('Each active rule requires a step');
      }
      if (!rule.isFallback && !rule.conditionJson) {
        throw new BadRequestException('Non-fallback rules require conditions');
      }
    }

    template.status = WorkflowTemplateStatus.PUBLISHED;
    return this.templatesRepository.save(template);
  }

  async deactivate(id: string): Promise<WorkflowTemplate> {
    const template = await this.findOne(id);
    const workflowInstanceCount = await this.countWorkflowInstances(id);
    if (workflowInstanceCount > 0) {
      throw new BadRequestException(
        'Workflow already associated can not deactivate',
      );
    }
    template.status = WorkflowTemplateStatus.INACTIVE;
    return this.templatesRepository.save(template);
  }

  async duplicate(id: string): Promise<WorkflowTemplate> {
    const template = await this.findOne(id);
    const duplicate = await this.templatesRepository.save(
      this.templatesRepository.create({
        name: `${template.name} Copy`,
        description: template.description,
        moduleName: template.moduleName,
        eventName: template.eventName,
        entityType: template.entityType,
        status: WorkflowTemplateStatus.DRAFT,
        priority: template.priority,
        effectiveFrom: template.effectiveFrom,
        effectiveTo: template.effectiveTo,
        allowResubmission: template.allowResubmission,
        createdById: template.createdById,
      }),
    );

    if (template.triggerCondition) {
      await this.triggerConditionsRepository.save(
        this.triggerConditionsRepository.create({
          workflowTemplateId: duplicate.id,
          conditionJson: template.triggerCondition.conditionJson,
        }),
      );
    }
    if (template.outcomeConfig) {
      await this.outcomeConfigsRepository.save(
        this.outcomeConfigsRepository.create({
          workflowTemplateId: duplicate.id,
          approvedActionsJson: template.outcomeConfig.approvedActionsJson,
          rejectedActionsJson: template.outcomeConfig.rejectedActionsJson,
        }),
      );
    }
    for (const rule of template.rules ?? []) {
      await this.createRule(duplicate.id, {
        name: rule.name,
        priority: rule.priority,
        conditionJson: rule.conditionJson,
        isFallback: rule.isFallback,
        isActive: rule.isActive,
        steps: (rule.steps ?? []).map((step) => ({ ...step })),
      });
    }
    return this.findOne(duplicate.id);
  }

  async createRule(
    workflowTemplateId: string,
    dto: CreateWorkflowRuleDto,
  ): Promise<WorkflowApprovalRule> {
    await this.validateRuleUniqueness(
      workflowTemplateId,
      dto.priority,
      dto.isFallback,
    );
    for (const step of dto.steps ?? []) {
      await this.validateStepAssignee(step);
    }

    const rule = await this.rulesRepository.save(
      this.rulesRepository.create({
        workflowTemplateId,
        name: dto.name,
        priority: dto.priority,
        conditionJson: dto.conditionJson ?? null,
        isFallback: dto.isFallback ?? false,
        isActive: dto.isActive ?? true,
      }),
    );
    for (const step of dto.steps ?? []) {
      await this.stepConfigsRepository.save(
        this.stepConfigsRepository.create({
          ...step,
          workflowApprovalRuleId: rule.id,
          isRequired: step.isRequired ?? true,
          requiresComment: step.requiresComment ?? false,
          canReject: step.canReject ?? true,
          canReassign: step.canReassign ?? false,
        }),
      );
    }
    return this.rulesRepository.findOneOrFail({
      where: { id: rule.id },
      relations: { steps: true },
      order: { steps: { stepOrder: 'ASC' } },
    });
  }

  private async saveTemplateChildren(
    workflowTemplateId: string,
    dto: Pick<
      CreateWorkflowTemplateDto,
      | 'moduleName'
      | 'entityType'
      | 'triggerConditionJson'
      | 'approvedActionsJson'
      | 'rejectedActionsJson'
    >,
  ): Promise<void> {
    if (dto.triggerConditionJson) {
      const existing = await this.triggerConditionsRepository.findOneBy({
        workflowTemplateId,
      });
      await this.triggerConditionsRepository.save(
        this.triggerConditionsRepository.create({
          id: existing?.id,
          workflowTemplateId,
          conditionJson: dto.triggerConditionJson,
        }),
      );
    }
    if (dto.approvedActionsJson || dto.rejectedActionsJson) {
      const existing = await this.outcomeConfigsRepository.findOneBy({
        workflowTemplateId,
      });
      await this.outcomeConfigsRepository.save(
        this.outcomeConfigsRepository.create({
          id: existing?.id,
          workflowTemplateId,
          approvedActionsJson: this.sanitizeApprovedActions(
            dto.moduleName,
            dto.entityType,
            dto.approvedActionsJson ?? existing?.approvedActionsJson ?? null,
          ),
          rejectedActionsJson:
            dto.rejectedActionsJson ?? existing?.rejectedActionsJson ?? null,
        }),
      );
    }
  }

  private async validateRuleUniqueness(
    workflowTemplateId: string,
    priority: number,
    isFallback = false,
    ignoreRuleId?: string,
  ): Promise<void> {
    const priorityRule = await this.rulesRepository.findOneBy({
      workflowTemplateId,
      priority,
    });
    if (priorityRule && priorityRule.id !== ignoreRuleId) {
      throw new BadRequestException(
        'Rule priority must be unique per template',
      );
    }
    if (isFallback) {
      const fallbackRule = await this.rulesRepository.findOneBy({
        workflowTemplateId,
        isFallback: true,
      });
      if (fallbackRule && fallbackRule.id !== ignoreRuleId) {
        throw new BadRequestException('Only one fallback rule is allowed');
      }
    }
  }

  private async validateStepAssignee(step: {
    assigneeType: WorkflowAssigneeType;
    assigneeRoleSlug?: string | null;
    assigneeUserId?: string | null;
    assigneeFieldPath?: string | null;
  }): Promise<void> {
    if (
      step.assigneeType === WorkflowAssigneeType.ROLE &&
      !step.assigneeRoleSlug
    ) {
      throw new BadRequestException('ROLE steps require assigneeRoleSlug');
    }
    if (
      step.assigneeType === WorkflowAssigneeType.ROLE &&
      step.assigneeRoleSlug &&
      this.rolesRepository
    ) {
      const role = await this.rolesRepository.findOneBy({
        slug: step.assigneeRoleSlug,
      });
      if (!role) {
        throw new BadRequestException(
          `Workflow role ${step.assigneeRoleSlug} does not exist`,
        );
      }
    }
    if (
      step.assigneeType === WorkflowAssigneeType.USER &&
      !step.assigneeUserId
    ) {
      throw new BadRequestException('USER steps require assigneeUserId');
    }
    if (
      step.assigneeType === WorkflowAssigneeType.CUSTOM_FIELD_USER &&
      !step.assigneeFieldPath
    ) {
      throw new BadRequestException(
        'CUSTOM_FIELD_USER steps require assigneeFieldPath',
      );
    }
  }

  private sanitizeApprovedActions(
    moduleName: string,
    entityType: string,
    actions: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!actions) return null;
    if (moduleName === 'expenses' && entityType === 'Expense') return actions;

    const sanitized = { ...actions };
    delete sanitized.createPaymentRequest;
    return sanitized;
  }

  private sanitizeTemplateOutcome(template: WorkflowTemplate): void {
    if (!template.outcomeConfig) return;
    template.outcomeConfig.approvedActionsJson = this.sanitizeApprovedActions(
      template.moduleName,
      template.entityType,
      template.outcomeConfig.approvedActionsJson,
    );
  }

  private countWorkflowInstances(workflowTemplateId: string): Promise<number> {
    return (
      this.workflowInstancesRepository?.count({
        where: { workflowTemplateId },
      }) ?? Promise.resolve(0)
    );
  }
}
