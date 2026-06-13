import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ConditionGroup } from '../condition.types';
import { WorkflowTemplate } from './workflow-template.entity';

@Entity({ name: 'workflow_trigger_conditions' })
export class WorkflowTriggerCondition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  workflowTemplateId!: string;

  @OneToOne(() => WorkflowTemplate, (template) => template.triggerCondition, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflowTemplateId' })
  workflowTemplate!: WorkflowTemplate;

  @Column({ type: 'jsonb' })
  conditionJson!: ConditionGroup;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
