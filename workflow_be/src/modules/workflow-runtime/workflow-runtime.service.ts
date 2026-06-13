import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { paginateRepo } from '../../common/http/paginate';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import {
  toIsoStringOrNull,
  toWorkflowUserResponse,
} from '../../common/workflow.utils';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { BillingRequest } from '../billing/entities/billing-request.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { RbacService } from '../rbac/rbac.service';
import { WorkflowApprovalRule } from '../workflow-builder/entities/workflow-approval-rule.entity';
import { WorkflowApprovalStepConfig } from '../workflow-builder/entities/workflow-approval-step-config.entity';
import { WorkflowTemplate } from '../workflow-builder/entities/workflow-template.entity';
import { WorkflowTemplateStatus } from '../workflow-builder/enums/workflow-builder.enums';
import { AssigneeResolverService } from './assignee-resolver.service';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import { WorkflowActionDto } from './dto/workflow-action.dto';
import {
  WorkflowActionResponseDto,
  WorkflowInstanceResponseDto,
  WorkflowRequestSummaryResponseDto,
  WorkflowStepResponseDto,
} from './dto/workflow-runtime-response.dto';
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

type WorkflowInstanceWithRequestTitle = WorkflowInstance & {
  expenseRequest?: Pick<Expense, 'title'> | null;
  billingRequest?: Pick<BillingRequest, 'title'> | null;
};

type WorkflowStepSummary = {
  id: string;
  stepName: string;
  stepOrder: number;
  assignedUserId: string | null;
  assignedRoleSlug: string | null;
  status: WorkflowStepStatus;
};

type AssignedEntityRow = {
  entityId: string;
};

export type TriggerWorkflowResult =
  | { status: 'skipped' }
  | {
      status: 'triggered';
      workflowInstanceId: string;
      activeStep: WorkflowStepSummary;
    };

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
    private readonly dataSource: DataSource,
  ) {}

  async trigger(dto: TriggerWorkflowDto): Promise<TriggerWorkflowResult> {
    return this.dataSource.transaction(async (manager) => {
      const templatesRepository = manager.getRepository(WorkflowTemplate);
      const instancesRepository = manager.getRepository(WorkflowInstance);
      const stepsRepository = manager.getRepository(WorkflowStep);
      const actionsRepository = manager.getRepository(WorkflowAction);
      const auditLogsRepository = manager.getRepository(AuditLog);
      const notificationsRepository = manager.getRepository(Notification);
      const metadata = dto.metadata ?? {};
      const templates = await templatesRepository.find({
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
        order: {
          priority: 'DESC',
          createdAt: 'DESC',
          rules: { priority: 'DESC' },
        },
      });

      const template = this.selectTemplate(templates, metadata);
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

      const instance = await instancesRepository.save(
        instancesRepository.create({
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

      const steps = await this.createSteps(
        instance,
        stepConfigs,
        dto,
        stepsRepository,
      );
      const activeStep = await this.activateStep(steps[0], stepsRepository);

      await this.recordAction(
        instance.id,
        null,
        WorkflowActionType.TRIGGERED,
        {
          actorUserId: dto.requesterId,
          metadataJson: metadata,
        },
        actionsRepository,
      );
      await this.recordAction(
        instance.id,
        activeStep.id,
        WorkflowActionType.STEP_ACTIVATED,
        { actorUserId: null },
        actionsRepository,
      );
      await this.auditLogsService.record(
        {
          actorUserId: dto.requesterId,
          action: 'WORKFLOW_TRIGGERED',
          entityType: dto.entityType,
          entityId: dto.entityId,
          workflowInstanceId: instance.id,
          oldStatus: null,
          newStatus: WorkflowInstanceStatus.ACTIVE,
          metadataJson: metadata,
        },
        auditLogsRepository,
      );
      await this.notificationsService.createTaskAssigned(
        {
          assignedUserId: activeStep.assignedUserId,
          assignedRoleSlug: activeStep.assignedRoleSlug,
          entityType: dto.entityType,
          entityId: dto.entityId,
          workflowInstanceId: instance.id,
          channels: { push: true, email: true },
        },
        notificationsRepository,
      );

      return {
        status: 'triggered',
        workflowInstanceId: instance.id,
        activeStep: this.toStepSummary(activeStep),
      };
    });
  }

  async allowsResubmission(workflowInstanceId: string): Promise<boolean> {
    const instance = await this.instancesRepository.findOne({
      where: { id: workflowInstanceId },
      relations: { workflowTemplate: true },
    });

    return instance?.workflowTemplate.allowResubmission ?? false;
  }

  async assignedEntityIdsForActor(
    entityType: string,
    actor: Express.User,
  ): Promise<string[]> {
    const rows = await this.instancesRepository
      .createQueryBuilder('instance')
      .innerJoin(WorkflowStep, 'step', 'step.workflowInstanceId = instance.id')
      .select('DISTINCT instance.entityId', 'entityId')
      .where('instance.entityType = :entityType', { entityType })
      .andWhere(
        '(step.assignedUserId = :userId OR step.assignedRoleSlug IN (:...roles))',
        {
          userId: actor.userId,
          roles: actor.roles.length ? actor.roles : ['__none__'],
        },
      )
      .getRawMany<AssignedEntityRow>();

    return rows.map((row) => row.entityId);
  }

  async userHasEntityAssignment(input: {
    entityType: string;
    entityId: string;
    actor: Express.User;
  }): Promise<boolean> {
    const count = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoin('step.workflowInstance', 'instance')
      .where('instance.entityType = :entityType', {
        entityType: input.entityType,
      })
      .andWhere('instance.entityId = :entityId', { entityId: input.entityId })
      .andWhere(
        '(step.assignedUserId = :userId OR step.assignedRoleSlug IN (:...roles))',
        {
          userId: input.actor.userId,
          roles: input.actor.roles.length ? input.actor.roles : ['__none__'],
        },
      )
      .getCount();

    return count > 0;
  }

  list(query: PaginationQueryDto) {
    return paginateRepo(this.instancesRepository, {
      page: query.page ?? 1,
      limit: query.limit ?? 25,
      order: { createdAt: 'DESC' },
      relations: { steps: true },
    });
  }

  async findOne(id: string): Promise<WorkflowInstanceResponseDto> {
    const instance = await this.instancesRepository.findOne({
      where: { id },
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
    if (!instance) throw new NotFoundException('Workflow instance not found');
    return this.toInstanceResponse(instance);
  }

  async myPending(actor: Express.User): Promise<WorkflowStepResponseDto[]> {
    const steps = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoinAndSelect('step.workflowInstance', 'instance')
      .leftJoinAndSelect('instance.requester', 'requester')
      .leftJoinAndMapOne(
        'instance.expenseRequest',
        Expense,
        'expense_request',
        'instance.entityType = :expenseEntityType AND instance.entityId = expense_request.id::text',
        { expenseEntityType: 'Expense' },
      )
      .leftJoinAndMapOne(
        'instance.billingRequest',
        BillingRequest,
        'billing_request',
        'instance.entityType = :billingEntityType AND instance.entityId = billing_request.id::text',
        { billingEntityType: 'BillingRequest' },
      )
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

    return steps.map((step) => this.toStepResponse(step));
  }

  async approveStep(
    stepId: string,
    actor: Express.User,
    dto: WorkflowActionDto,
  ): Promise<WorkflowStepResponseDto> {
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
        channels: { push: true, email: true },
      });
    } else {
      instance.status = WorkflowInstanceStatus.APPROVED;
      instance.completedAt = new Date();
      await this.instancesRepository.save(instance);
      const template = await this.templatesRepository.findOne({
        where: { id: instance.workflowTemplateId },
        relations: { outcomeConfig: true },
      });
      await this.outcomeHandler.handleApproved(
        instance,
        template?.outcomeConfig?.approvedActionsJson ?? null,
      );
      await this.notificationsService.createWorkflowApproved({
        recipientUserId: instance.requesterId,
        entityType: instance.entityType,
        entityId: instance.entityId,
        workflowInstanceId: instance.id,
        channels: { push: true, email: true },
      });
    }

    return this.toStepResponse(step);
  }

  async cancelActiveForEntity(input: {
    entityType: string;
    entityId: string;
    actorUserId: string;
  }): Promise<void> {
    const instance = await this.instancesRepository.findOneBy({
      entityType: input.entityType,
      entityId: input.entityId,
      status: WorkflowInstanceStatus.ACTIVE,
    });
    if (!instance) return;

    const cancelledAt = new Date();
    instance.status = WorkflowInstanceStatus.CANCELLED;
    instance.completedAt = cancelledAt;
    await this.instancesRepository.save(instance);
    await this.stepsRepository.update(
      {
        workflowInstanceId: instance.id,
        status: In([WorkflowStepStatus.ACTIVE, WorkflowStepStatus.WAITING]),
      },
      {
        status: WorkflowStepStatus.SKIPPED,
        actedAt: cancelledAt,
        actionByUserId: input.actorUserId,
      },
    );
    await this.recordAction(instance.id, null, WorkflowActionType.CANCELLED, {
      actorUserId: input.actorUserId,
    });
    await this.auditLogsService.record({
      actorUserId: input.actorUserId,
      action: 'WORKFLOW_CANCELLED',
      entityType: instance.entityType,
      entityId: instance.entityId,
      workflowInstanceId: instance.id,
      oldStatus: WorkflowInstanceStatus.ACTIVE,
      newStatus: WorkflowInstanceStatus.CANCELLED,
    });
  }

  async rejectStep(
    stepId: string,
    actor: Express.User,
    dto: WorkflowActionDto,
  ): Promise<WorkflowStepResponseDto> {
    if (!dto.reason)
      throw new BadRequestException('Rejection reason is required');
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
      channels: { push: true, email: true },
    });
    return this.toStepResponse(step);
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

  private selectTemplate(
    templates: WorkflowTemplate[],
    metadata: Record<string, unknown>,
  ): WorkflowTemplate | null {
    const matchingTemplates = templates.filter((candidate) =>
      this.ruleEngine.matches(
        metadata,
        candidate.triggerCondition?.conditionJson ?? null,
      ),
    );

    return (
      [...matchingTemplates].sort(
        (a, b) =>
          b.priority - a.priority ||
          this.triggerSpecificity(b) - this.triggerSpecificity(a),
      )[0] ?? null
    );
  }

  private triggerSpecificity(template: WorkflowTemplate): number {
    return template.triggerCondition?.conditionJson.conditions.length ?? 0;
  }

  private async createSteps(
    instance: WorkflowInstance,
    stepConfigs: WorkflowApprovalStepConfig[],
    dto: TriggerWorkflowDto,
    stepsRepository: Repository<WorkflowStep> = this.stepsRepository,
  ): Promise<WorkflowStep[]> {
    const steps: WorkflowStep[] = [];
    for (const config of stepConfigs) {
      const assignee = await this.assigneeResolver.resolve(config, {
        requesterId: dto.requesterId,
        departmentId: dto.departmentId ?? null,
        metadata: dto.metadata ?? {},
      });
      steps.push(
        await stepsRepository.save(
          stepsRepository.create({
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

  private async activateStep(
    step: WorkflowStep,
    stepsRepository: Repository<WorkflowStep> = this.stepsRepository,
  ): Promise<WorkflowStep> {
    step.status = WorkflowStepStatus.ACTIVE;
    step.activatedAt = new Date();
    return stepsRepository.save(step);
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
        (await this.rbacService.userHasRole(
          actor.userId,
          step.assignedRoleSlug,
        )))
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
    actionsRepository: Repository<WorkflowAction> = this.actionsRepository,
  ): Promise<WorkflowAction> {
    return actionsRepository.save(
      actionsRepository.create({
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

  private toStepSummary(step: WorkflowStep): WorkflowStepSummary {
    return {
      id: step.id,
      stepName: step.stepName,
      stepOrder: step.stepOrder,
      assignedUserId: step.assignedUserId,
      assignedRoleSlug: step.assignedRoleSlug,
      status: step.status,
    };
  }

  private toInstanceResponse(
    instance: WorkflowInstance,
  ): WorkflowInstanceResponseDto {
    return {
      id: instance.id,
      workflowTemplateId: instance.workflowTemplateId,
      workflowApprovalRuleId: instance.workflowApprovalRuleId,
      moduleName: instance.moduleName,
      eventName: instance.eventName,
      entityType: instance.entityType,
      entityId: instance.entityId,
      requesterId: instance.requesterId,
      requester: toWorkflowUserResponse(instance.requester),
      departmentId: instance.departmentId,
      status: instance.status,
      metadataJson: instance.metadataJson,
      startedAt: toIsoStringOrNull(instance.startedAt),
      completedAt: toIsoStringOrNull(instance.completedAt),
      rejectedAt: toIsoStringOrNull(instance.rejectedAt),
      steps: (instance.steps ?? []).map((step) => this.toStepResponse(step)),
      actions: (instance.actions ?? []).map((action) =>
        this.toActionResponse(action),
      ),
      createdAt: instance.createdAt.toISOString(),
      updatedAt: instance.updatedAt.toISOString(),
    };
  }

  private toStepResponse(step: WorkflowStep): WorkflowStepResponseDto {
    return {
      id: step.id,
      workflowInstanceId: step.workflowInstanceId,
      request: this.toRequestSummary(step.workflowInstance),
      stepOrder: step.stepOrder,
      stepName: step.stepName,
      stepType: step.stepType,
      assignedUserId: step.assignedUserId,
      assignedUser: toWorkflowUserResponse(step.assignedUser),
      assignedRoleSlug: step.assignedRoleSlug,
      assigneeType: step.assigneeType,
      status: step.status,
      activatedAt: toIsoStringOrNull(step.activatedAt),
      actedAt: toIsoStringOrNull(step.actedAt),
      actionByUserId: step.actionByUserId,
      actionByUser: toWorkflowUserResponse(step.actionByUser),
      comment: step.comment,
      rejectionReason: step.rejectionReason,
      actions: (step.actions ?? []).map((action) =>
        this.toActionResponse(action),
      ),
      createdAt: step.createdAt.toISOString(),
      updatedAt: step.updatedAt.toISOString(),
    };
  }

  private toActionResponse(action: WorkflowAction): WorkflowActionResponseDto {
    return {
      id: action.id,
      workflowInstanceId: action.workflowInstanceId,
      workflowStepId: action.workflowStepId,
      action: action.action,
      actorUserId: action.actorUserId,
      actorUser: toWorkflowUserResponse(action.actorUser),
      comment: action.comment,
      reason: action.reason,
      metadataJson: action.metadataJson,
      createdAt: action.createdAt.toISOString(),
    };
  }

  private toRequestSummary(
    instance: WorkflowInstanceWithRequestTitle | null | undefined,
  ): WorkflowRequestSummaryResponseDto | null {
    if (!instance) return null;

    const metadata = instance.metadataJson;
    return {
      title: this.requestTitle(instance, metadata),
      type: instance.entityType,
      requesterId: instance.requesterId,
      requester: toWorkflowUserResponse(instance.requester),
      amount: this.metadataNumber(metadata, 'amount'),
      currency: this.metadataString(metadata, 'currency'),
      leaveDays: this.metadataNumber(metadata, 'leaveDays'),
      createdAt: instance.createdAt.toISOString(),
    };
  }

  private requestTitle(
    instance: WorkflowInstanceWithRequestTitle,
    metadata: Record<string, unknown> | null,
  ): string {
    const title =
      this.metadataString(metadata, 'title') ??
      this.metadataString(metadata, 'requestTitle');
    if (title) return title;

    if (instance.entityType === 'Expense' && instance.expenseRequest?.title) {
      return instance.expenseRequest.title;
    }

    if (
      instance.entityType === 'BillingRequest' &&
      instance.billingRequest?.title
    ) {
      return instance.billingRequest.title;
    }

    if (instance.entityType === 'LeaveRequest') {
      const leaveType = this.metadataString(metadata, 'leaveType');
      if (leaveType)
        return `${this.humanizeRequestType(leaveType)} leave request`;
    }

    return `${instance.entityType} ${instance.entityId}`;
  }

  private metadataString(
    metadata: Record<string, unknown> | null,
    key: string,
  ): string | null {
    const value = metadata?.[key];
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private metadataNumber(
    metadata: Record<string, unknown> | null,
    key: string,
  ): number | null {
    const value = metadata?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private humanizeRequestType(value: string): string {
    return value
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
