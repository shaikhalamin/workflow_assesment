import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowBuilderModule } from '../workflow-builder/workflow-builder.module';
import { WorkflowAction } from './entities/workflow-action.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { RuleEngineService } from './rule-engine.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowInstance, WorkflowStep, WorkflowAction]),
    WorkflowBuilderModule,
  ],
  providers: [RuleEngineService],
  exports: [TypeOrmModule, RuleEngineService],
})
export class WorkflowRuntimeModule {}
