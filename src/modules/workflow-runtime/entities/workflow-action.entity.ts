import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkflowActionType } from '../enums/workflow-runtime.enums';
import { WorkflowInstance } from './workflow-instance.entity';
import { WorkflowStep } from './workflow-step.entity';

@Entity({ name: 'workflow_actions' })
export class WorkflowAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  workflowInstanceId!: string;

  @ManyToOne(() => WorkflowInstance, (instance) => instance.actions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflowInstanceId' })
  workflowInstance!: WorkflowInstance;

  @Column({ type: 'uuid', nullable: true })
  workflowStepId!: string | null;

  @ManyToOne(() => WorkflowStep, (step) => step.actions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'workflowStepId' })
  workflowStep!: WorkflowStep | null;

  @Column({ type: 'enum', enum: WorkflowActionType })
  action!: WorkflowActionType;

  @Column({ type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadataJson!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
