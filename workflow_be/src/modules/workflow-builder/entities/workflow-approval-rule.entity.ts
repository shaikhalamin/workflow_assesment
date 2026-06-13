import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { ConditionGroup } from '../condition.types';
import { WorkflowApprovalStepConfig } from './workflow-approval-step-config.entity';
import { WorkflowTemplate } from './workflow-template.entity';

@Entity({ name: 'workflow_approval_rules' })
@Unique(['workflowTemplateId', 'priority'])
export class WorkflowApprovalRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  workflowTemplateId!: string;

  @ManyToOne(() => WorkflowTemplate, (template) => template.rules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflowTemplateId' })
  workflowTemplate!: WorkflowTemplate;

  @Column()
  name!: string;

  @Column({ default: 0 })
  priority!: number;

  @Column({ type: 'jsonb', nullable: true })
  conditionJson!: ConditionGroup | null;

  @Column({ default: false })
  isFallback!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(
    () => WorkflowApprovalStepConfig,
    (step) => step.workflowApprovalRule,
  )
  steps!: WorkflowApprovalStepConfig[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
