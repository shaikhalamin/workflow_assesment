import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkflowStepConfigDto } from './dto/create-workflow-step-config.dto';
import { UpdateWorkflowRuleDto } from './dto/update-workflow-rule.dto';
import { UpdateWorkflowStepConfigDto } from './dto/update-workflow-step-config.dto';
import { WorkflowApprovalRule } from './entities/workflow-approval-rule.entity';
import { WorkflowApprovalStepConfig } from './entities/workflow-approval-step-config.entity';
import { WorkflowAssigneeType } from './enums/workflow-builder.enums';

@Injectable()
export class WorkflowRuleService {
  constructor(
    @InjectRepository(WorkflowApprovalRule)
    private readonly rulesRepository: Repository<WorkflowApprovalRule>,
    @InjectRepository(WorkflowApprovalStepConfig)
    private readonly stepConfigsRepository: Repository<WorkflowApprovalStepConfig>,
  ) {}

  async updateRule(
    id: string,
    dto: UpdateWorkflowRuleDto,
  ): Promise<WorkflowApprovalRule> {
    const rule = await this.rulesRepository.findOneBy({ id });
    if (!rule) throw new NotFoundException('Workflow rule not found');
    if (dto.priority !== undefined) {
      await this.assertUniqueRulePriority(
        rule.workflowTemplateId,
        dto.priority,
        id,
      );
    }
    if (dto.isFallback) {
      const fallback = await this.rulesRepository.findOneBy({
        workflowTemplateId: rule.workflowTemplateId,
        isFallback: true,
      });
      if (fallback && fallback.id !== id) {
        throw new BadRequestException('Only one fallback rule is allowed');
      }
    }
    Object.assign(rule, dto);
    return this.rulesRepository.save(rule);
  }

  async deleteRule(id: string): Promise<void> {
    await this.rulesRepository.delete(id);
  }

  async createStep(
    workflowApprovalRuleId: string,
    dto: CreateWorkflowStepConfigDto,
  ): Promise<WorkflowApprovalStepConfig> {
    this.validateStepAssignee(dto);
    await this.assertUniqueStepOrder(workflowApprovalRuleId, dto.stepOrder);
    return this.stepConfigsRepository.save(
      this.stepConfigsRepository.create({
        ...dto,
        workflowApprovalRuleId,
        isRequired: dto.isRequired ?? true,
        requiresComment: dto.requiresComment ?? false,
        canReject: dto.canReject ?? true,
        canReassign: dto.canReassign ?? false,
      }),
    );
  }

  async updateStep(
    id: string,
    dto: UpdateWorkflowStepConfigDto,
  ): Promise<WorkflowApprovalStepConfig> {
    const step = await this.stepConfigsRepository.findOneBy({ id });
    if (!step) throw new NotFoundException('Workflow step config not found');
    const next = { ...step, ...dto };
    this.validateStepAssignee(next);
    if (dto.stepOrder !== undefined) {
      await this.assertUniqueStepOrder(
        step.workflowApprovalRuleId,
        dto.stepOrder,
        id,
      );
    }
    Object.assign(step, dto);
    return this.stepConfigsRepository.save(step);
  }

  async deleteStep(id: string): Promise<void> {
    await this.stepConfigsRepository.delete(id);
  }

  private async assertUniqueRulePriority(
    workflowTemplateId: string,
    priority: number,
    ignoreId: string,
  ): Promise<void> {
    const existing = await this.rulesRepository.findOneBy({
      workflowTemplateId,
      priority,
    });
    if (existing && existing.id !== ignoreId) {
      throw new BadRequestException(
        'Rule priority must be unique per template',
      );
    }
  }

  private async assertUniqueStepOrder(
    workflowApprovalRuleId: string,
    stepOrder: number,
    ignoreId?: string,
  ): Promise<void> {
    const existing = await this.stepConfigsRepository.findOneBy({
      workflowApprovalRuleId,
      stepOrder,
    });
    if (existing && existing.id !== ignoreId) {
      throw new BadRequestException('Step order must be unique per rule');
    }
  }

  private validateStepAssignee(step: {
    assigneeType: WorkflowAssigneeType;
    assigneeRoleSlug?: string | null;
    assigneeUserId?: string | null;
    assigneeFieldPath?: string | null;
  }): void {
    if (
      step.assigneeType === WorkflowAssigneeType.ROLE &&
      !step.assigneeRoleSlug
    ) {
      throw new BadRequestException('ROLE steps require assigneeRoleSlug');
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
}
