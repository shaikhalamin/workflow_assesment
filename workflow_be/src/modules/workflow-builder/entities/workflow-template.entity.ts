import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkflowTemplateStatus } from '../enums/workflow-builder.enums';
import { WorkflowApprovalRule } from './workflow-approval-rule.entity';
import { WorkflowOutcomeConfig } from './workflow-outcome-config.entity';
import { WorkflowTriggerCondition } from './workflow-trigger-condition.entity';

@Entity({ name: 'workflow_templates' })
export class WorkflowTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column()
  moduleName!: string;

  @Column()
  eventName!: string;

  @Column()
  entityType!: string;

  @Column({
    type: 'enum',
    enum: WorkflowTemplateStatus,
    default: WorkflowTemplateStatus.DRAFT,
  })
  status!: WorkflowTemplateStatus;

  @Column({ default: 0 })
  priority!: number;

  @Column({ type: 'timestamptz', nullable: true })
  effectiveFrom!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  effectiveTo!: Date | null;

  @Column({ default: true })
  allowResubmission!: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdById!: string | null;

  @OneToOne(
    () => WorkflowTriggerCondition,
    (triggerCondition) => triggerCondition.workflowTemplate,
  )
  triggerCondition!: WorkflowTriggerCondition | null;

  @OneToMany(() => WorkflowApprovalRule, (rule) => rule.workflowTemplate)
  rules!: WorkflowApprovalRule[];

  @OneToOne(() => WorkflowOutcomeConfig, (outcome) => outcome.workflowTemplate)
  outcomeConfig!: WorkflowOutcomeConfig | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
