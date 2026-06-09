import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionValidatorService } from './condition-validator.service';
import { WorkflowApprovalRule } from './entities/workflow-approval-rule.entity';
import { WorkflowApprovalStepConfig } from './entities/workflow-approval-step-config.entity';
import { WorkflowEventSchema } from './entities/workflow-event-schema.entity';
import { WorkflowOutcomeConfig } from './entities/workflow-outcome-config.entity';
import { WorkflowTemplate } from './entities/workflow-template.entity';
import { WorkflowTriggerCondition } from './entities/workflow-trigger-condition.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowTemplate,
      WorkflowEventSchema,
      WorkflowTriggerCondition,
      WorkflowApprovalRule,
      WorkflowApprovalStepConfig,
      WorkflowOutcomeConfig,
    ]),
  ],
  providers: [ConditionValidatorService],
  exports: [TypeOrmModule, ConditionValidatorService],
})
export class WorkflowBuilderModule {}
