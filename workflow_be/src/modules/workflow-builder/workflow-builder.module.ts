import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionValidatorService } from './condition-validator.service';
import { WorkflowApprovalRule } from './entities/workflow-approval-rule.entity';
import { WorkflowApprovalStepConfig } from './entities/workflow-approval-step-config.entity';
import { WorkflowEventSchema } from './entities/workflow-event-schema.entity';
import { WorkflowOutcomeConfig } from './entities/workflow-outcome-config.entity';
import { WorkflowTemplate } from './entities/workflow-template.entity';
import { WorkflowTriggerCondition } from './entities/workflow-trigger-condition.entity';
import { WorkflowInstance } from '../workflow-runtime/entities/workflow-instance.entity';
import { Role } from '../rbac/entities/role.entity';
import { WorkflowEventSchemaController } from './workflow-event-schema.controller';
import { WorkflowEventSchemaService } from './workflow-event-schema.service';
import { WorkflowRuleController } from './workflow-rule.controller';
import { WorkflowRuleService } from './workflow-rule.service';
import { WorkflowStepConfigController } from './workflow-step-config.controller';
import { WorkflowTemplateController } from './workflow-template.controller';
import { WorkflowTemplateService } from './workflow-template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowTemplate,
      WorkflowEventSchema,
      WorkflowTriggerCondition,
      WorkflowApprovalRule,
      WorkflowApprovalStepConfig,
      WorkflowOutcomeConfig,
      WorkflowInstance,
      Role,
    ]),
  ],
  controllers: [
    WorkflowTemplateController,
    WorkflowEventSchemaController,
    WorkflowRuleController,
    WorkflowStepConfigController,
  ],
  providers: [
    ConditionValidatorService,
    WorkflowTemplateService,
    WorkflowEventSchemaService,
    WorkflowRuleService,
  ],
  exports: [
    TypeOrmModule,
    ConditionValidatorService,
    WorkflowTemplateService,
    WorkflowEventSchemaService,
    WorkflowRuleService,
  ],
})
export class WorkflowBuilderModule {}
