import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginateRepo } from '../../common/http/paginate';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RbacService } from '../rbac/rbac.service';
import { WorkflowApprovalRule } from '../workflow-builder/entities/workflow-approval-rule.entity';
import { WorkflowApprovalStepConfig } from '../workflow-builder/entities/workflow-approval-step-config.entity';
import { WorkflowTemplate } from '../workflow-builder/entities/workflow-template.entity';
import { WorkflowTemplateStatus } from '../workflow-builder/enums/workflow-builder.enums';
import { AssigneeResolverService } from './assignee-resolver.service';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import { WorkflowActionDto } from './dto/workflow-action.dto';
import { WorkflowAction } from './entities/workflow-action.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import {
  WorkflowActionType,
  WorkflowInstanceStatus,
  WorkflowStepStatus,
} from './enums/workflow-runtime.enums';
import { OutcomeHandlerService } from './outcome-handler.service';
import { RuleEngineService } from './rule-engine.service';

@Injectable()
export class WorkflowRuntimeService {
  constructor(
    @InjectRepository(WorkflowTemplate)
    private readonly templatesRepository: Repository<WorkflowTemplate>,
    @InjectRepository(WorkflowInstance)
    private readonly instancesRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private readonly stepsRepository: Repository<WorkflowStep>,
    @InjectRepository(WorkflowAction)
    private readonly actionsRepository: Repository<WorkflowAction>,
    private readonly ruleEngine: RuleEngineService,
    private readonly assigneeResolver: AssigneeResolverService,
    private readonly outcomeHandler: OutcomeHandlerService,
    private readonly rbacService: RbacService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async trigger(dto: TriggerWorkflowDto) {
    const metadata = dto.metadata ?? {};
    const templates = await this.templatesRepository.find({
      where: {
        moduleName: dto.moduleName,
        eventName: dto.eventName,
        entityType: dto.entityType,
        status: WorkflowTemplateStatus.PUBLISHED,
      },
      relations: {
        triggerCondition: true,
        rules: { steps: true },
      },
      order: { priority: 'DESC', rules: { priority: 'DESC' } },
    });

    const template = templates.find((candidate) =>
      this.ruleEngine.matches(
        metadata,
        candidate.triggerCondition?.conditionJson ?? null,
      ),
    );
    if (!template) return { status: 'skipped' };

    const selectedRule = this.selectRule(template.rules ?? [], metadata);
    if (!selectedRule) {
      throw new BadRequestException('No workflow approval rule applies');
    }
    const stepConfigs = [...(selectedRule.steps ?? [])].sort(
      (a, b) => a.stepOrder - b.stepOrder,
    );
    if (!stepConfigs.length) {
      throw new BadRequestException('Selected workflow rule has no steps');
    }

    const instance = await this.instancesRepository.save(
      this.instancesRepository.create({
        workflowTemplateId: template.id,
        workflowApprovalRuleId: selectedRule.id,
        moduleName: dto.moduleName,
        eventName: dto.eventName,
        entityType: dto.entityType,
        entityId: dto.entityId,
        requesterId: dto.requesterId,
        departmentId: dto.departmentId ?? null,
        status: WorkflowInstanceStatus.ACTIVE,
        metadataJson: metadata,
        startedAt: new Date(),
      }),
    );

    const steps = await this.createSteps(instance, stepConfigs, dto);
    const activeStep = await this.activateStep(steps[0]);

    await this.recordAction(instance.id, null, WorkflowActionType.TRIGGERED, {
      actorUserId: dto.requesterId,
      metadataJson: metadata,
    });
    await this.recordAction(
      instance.id,
      activeStep.id,
      WorkflowActionType.STEP_ACTIVATED,
      { actorUserId: null },
    );
    await this.auditLogsService.record({
      actorUserId: dto.requesterId,
      action: 'WORKFLOW_TRIGGERED',
      entityType: dto.entityType,
      entityId: dto.entityId,
      workflowInstanceId: instance.id,
      oldStatus: null,
      newStatus: WorkflowInstanceStatus.ACTIVE,
      metadataJson: metadata,
    });
    await this.notificationsService.createTaskAssigned({
      assignedUserId: activeStep.assignedUserId,
      assignedRoleSlug: activeStep.assignedRoleSlug,
      entityType: dto.entityType,
      entityId: dto.entityId,
      workflowInstanceId: instance.id,
    });

    return {
      status: 'triggered',
      workflowInstanceId: instance.id,
      activeStep: this.toStepSummary(activeStep),
    };
  }

  list(query: PaginationQueryDto) {
    return paginateRepo(this.instancesRepository, {
      page: query.page ?? 1,
      limit: query.limit ?? 25,
      order: { createdAt: 'DESC' },
      relations: { steps: true },
    });
  }

  async findOne(id: string): Promise<WorkflowInstance> {
    const instance = await this.instancesRepository.findOne({
      where: { id },
      relations: { steps: true, actions: true },
    });
    if (!instance) throw new NotFoundException('Workflow instance not found');
    return instance;
  }

  async myPending(actor: Express.User) {
    return this.stepsRepository
      .createQueryBuilder('step')
      .innerJoinAndSelect('step.workflowInstance', 'instance')
      .where('step.status = :status', { status: WorkflowStepStatus.ACTIVE })
      .andWhere(
        '(step.assignedUserId = :userId OR step.assignedRoleSlug IN (:...roles))',
        {
          userId: actor.userId,
          roles: actor.roles.length ? actor.roles : ['__none__'],
        },
      )
      .orderBy('step.activatedAt', 'ASC')
      .getMany();
  }

  async approveStep(
    stepId: string,
    actor: Express.User,
    dto: WorkflowActionDto,
  ): Promise<WorkflowStep> {
    const step = await this.getActiveStepForAction(stepId, actor);
    step.status = WorkflowStepStatus.APPROVED;
    step.actedAt = new Date();
    step.actionByUserId = actor.userId;
    step.comment = dto.comment ?? null;
    await this.stepsRepository.save(step);

    await this.recordAction(
      step.workflowInstanceId,
      step.id,
      WorkflowActionType.APPROVED,
      {
        actorUserId: actor.userId,
        comment: dto.comment ?? null,
        metadataJson: dto.metadata ?? null,
      },
    );
    const instance = await this.instancesRepository.findOneByOrFail({
      id: step.workflowInstanceId,
    });
    await this.auditLogsService.record({
      actorUserId: actor.userId,
      action: 'WORKFLOW_STEP_APPROVED',
      entityType: instance.entityType,
      entityId: instance.entityId,
      workflowInstanceId: instance.id,
      workflowStepId: step.id,
      oldStatus: WorkflowStepStatus.ACTIVE,
      newStatus: WorkflowStepStatus.APPROVED,
      comment: dto.comment ?? null,
      metadataJson: dto.metadata ?? null,
    });

    const nextStep = await this.stepsRepository.findOne({
      where: {
        workflowInstanceId: step.workflowInstanceId,
        status: WorkflowStepStatus.WAITING,
      },
      order: { stepOrder: 'ASC' },
    });

    if (nextStep) {
      const activated = await this.activateStep(nextStep);
      await this.notificationsService.createTaskAssigned({
        assignedUserId: activated.assignedUserId,
        assignedRoleSlug: activated.assignedRoleSlug,
        entityType: instance.entityType,
        entityId: instance.entityId,
        workflowInstanceId: instance.id,
      });
    } else {
      instance.status = WorkflowInstanceStatus.APPROVED;
      instance.completedAt = new Date();
      await this.instancesRepository.save(instance);
      await this.outcomeHandler.handleApproved(instance);
      await this.notificationsService.createWorkflowApproved({
        recipientUserId: instance.requesterId,
        entityType: instance.entityType,
        entityId: instance.entityId,
        workflowInstanceId: instance.id,
      });
    }

    return step;
  }

  async rejectStep(
    stepId: string,
    actor: Express.User,
    dto: WorkflowActionDto,
  ): Promise<WorkflowStep> {
    if (!dto.reason) throw new BadRequestException('Rejection reason is required');
    const step = await this.getActiveStepForAction(stepId, actor);
    step.status = WorkflowStepStatus.REJECTED;
    step.actedAt = new Date();
    step.actionByUserId = actor.userId;
    step.comment = dto.comment ?? null;
    step.rejectionReason = dto.reason;
    await this.stepsRepository.save(step);

    const instance = await this.instancesRepository.findOneByOrFail({
      id: step.workflowInstanceId,
    });
    instance.status = WorkflowInstanceStatus.REJECTED;
    instance.rejectedAt = new Date();
    await this.instancesRepository.save(instance);

    await this.stepsRepository.update(
      {
        workflowInstanceId: step.workflowInstanceId,
        status: WorkflowStepStatus.WAITING,
      },
      { status: WorkflowStepStatus.SKIPPED },
    );
    await this.recordAction(
      step.workflowInstanceId,
      step.id,
      WorkflowActionType.REJECTED,
      {
        actorUserId: actor.userId,
        comment: dto.comment ?? null,
        reason: dto.reason,
        metadataJson: dto.metadata ?? null,
      },
    );
    await this.auditLogsService.record({
      actorUserId: actor.userId,
      action: 'WORKFLOW_STEP_REJECTED',
      entityType: instance.entityType,
      entityId: instance.entityId,
      workflowInstanceId: instance.id,
      workflowStepId: step.id,
      oldStatus: WorkflowStepStatus.ACTIVE,
      newStatus: WorkflowStepStatus.REJECTED,
      comment: dto.comment ?? null,
      reason: dto.reason,
      metadataJson: dto.metadata ?? null,
    });
    await this.outcomeHandler.handleRejected(instance, dto.reason);
    await this.notificationsService.createWorkflowRejected({
      recipientUserId: instance.requesterId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      workflowInstanceId: instance.id,
    });
    return step;
  }

  async commentStep(
    stepId: string,
    actor: Express.User,
    dto: WorkflowActionDto,
  ): Promise<WorkflowAction> {
    const step = await this.stepsRepository.findOneBy({ id: stepId });
    if (!step) throw new NotFoundException('Workflow step not found');
    await this.assertActorCanAct(step, actor);
    const action = await this.recordAction(
      step.workflowInstanceId,
      step.id,
      WorkflowActionType.COMMENTED,
      {
        actorUserId: actor.userId,
        comment: dto.comment ?? null,
        metadataJson: dto.metadata ?? null,
      },
    );
    const instance = await this.instancesRepository.findOneByOrFail({
      id: step.workflowInstanceId,
    });
    await this.auditLogsService.record({
      actorUserId: actor.userId,
      action: 'WORKFLOW_STEP_COMMENTED',
      entityType: instance.entityType,
      entityId: instance.entityId,
      workflowInstanceId: instance.id,
      workflowStepId: step.id,
      oldStatus: step.status,
      newStatus: step.status,
      comment: dto.comment ?? null,
      metadataJson: dto.metadata ?? null,
    });
    return action;
  }

  private selectRule(
    rules: WorkflowApprovalRule[],
    metadata: Record<string, unknown>,
  ): WorkflowApprovalRule | null {
    const activeRules = rules.filter((rule) => rule.isActive);
    const normalMatch = activeRules
      .filter((rule) => !rule.isFallback)
      .sort((a, b) => b.priority - a.priority)
      .find((rule) => this.ruleEngine.matches(metadata, rule.conditionJson));
    return (
      normalMatch ??
      activeRules
        .filter((rule) => rule.isFallback)
        .sort((a, b) => b.priority - a.priority)[0] ??
      null
    );
  }

  private async createSteps(
    instance: WorkflowInstance,
    stepConfigs: WorkflowApprovalStepConfig[],
    dto: TriggerWorkflowDto,
  ): Promise<WorkflowStep[]> {
    const steps: WorkflowStep[] = [];
    for (const config of stepConfigs) {
      const assignee = await this.assigneeResolver.resolve(config, {
        requesterId: dto.requesterId,
        departmentId: dto.departmentId ?? null,
        metadata: dto.metadata ?? {},
      });
      steps.push(
        await this.stepsRepository.save(
          this.stepsRepository.create({
            workflowInstanceId: instance.id,
            stepOrder: config.stepOrder,
            stepName: config.stepName,
            stepType: config.stepType,
            assigneeType: config.assigneeType,
            assignedUserId: assignee.assignedUserId,
            assignedRoleSlug: assignee.assignedRoleSlug,
            status: WorkflowStepStatus.WAITING,
          }),
        ),
      );
    }
    return steps;
  }

  private async activateStep(step: WorkflowStep): Promise<WorkflowStep> {
    step.status = WorkflowStepStatus.ACTIVE;
    step.activatedAt = new Date();
    return this.stepsRepository.save(step);
  }

  private async getActiveStepForAction(
    stepId: string,
    actor: Express.User,
  ): Promise<WorkflowStep> {
    const step = await this.stepsRepository.findOneBy({ id: stepId });
    if (!step) throw new NotFoundException('Workflow step not found');
    if (step.status !== WorkflowStepStatus.ACTIVE) {
      throw new BadRequestException('Workflow step is not active');
    }
    await this.assertActorCanAct(step, actor);
    return step;
  }

  private async assertActorCanAct(
    step: WorkflowStep,
    actor: Express.User,
  ): Promise<void> {
    if (step.assignedUserId && step.assignedUserId === actor.userId) return;
    if (
      step.assignedRoleSlug &&
      (actor.roles.includes(step.assignedRoleSlug) ||
        (await this.rbacService.userHasRole(actor.userId, step.assignedRoleSlug)))
    ) {
      return;
    }
    throw new ForbiddenException('User is not assigned to this workflow step');
  }

  private recordAction(
    workflowInstanceId: string,
    workflowStepId: string | null,
    action: WorkflowActionType,
    data: {
      actorUserId: string | null;
      comment?: string | null;
      reason?: string | null;
      metadataJson?: Record<string, unknown> | null;
    },
  ): Promise<WorkflowAction> {
    return this.actionsRepository.save(
      this.actionsRepository.create({
        workflowInstanceId,
        workflowStepId,
        action,
        actorUserId: data.actorUserId,
        comment: data.comment ?? null,
        reason: data.reason ?? null,
        metadataJson: data.metadataJson ?? null,
      }),
    );
  }

  private toStepSummary(step: WorkflowStep) {
    return {
      id: step.id,
      stepName: step.stepName,
      stepOrder: step.stepOrder,
      assignedUserId: step.assignedUserId,
      assignedRoleSlug: step.assignedRoleSlug,
      status: step.status,
    };
  }
}
