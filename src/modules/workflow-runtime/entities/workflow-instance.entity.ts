import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkflowApprovalRule } from '../../workflow-builder/entities/workflow-approval-rule.entity';
import { WorkflowTemplate } from '../../workflow-builder/entities/workflow-template.entity';
import { WorkflowInstanceStatus } from '../enums/workflow-runtime.enums';
import { WorkflowAction } from './workflow-action.entity';
import { WorkflowStep } from './workflow-step.entity';

@Entity({ name: 'workflow_instances' })
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  workflowTemplateId!: string;

  @ManyToOne(() => WorkflowTemplate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workflowTemplateId' })
  workflowTemplate!: WorkflowTemplate;

  @Column({ type: 'uuid' })
  workflowApprovalRuleId!: string;

  @ManyToOne(() => WorkflowApprovalRule, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workflowApprovalRuleId' })
  workflowApprovalRule!: WorkflowApprovalRule;

  @Column()
  moduleName!: string;

  @Column()
  eventName!: string;

  @Column()
  entityType!: string;

  @Column()
  entityId!: string;

  @Column({ type: 'uuid' })
  requesterId!: string;

  @Column({ type: 'uuid', nullable: true })
  departmentId!: string | null;

  @Column({
    type: 'enum',
    enum: WorkflowInstanceStatus,
    default: WorkflowInstanceStatus.PENDING,
  })
  status!: WorkflowInstanceStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadataJson!: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt!: Date | null;

  @OneToMany(() => WorkflowStep, (step) => step.workflowInstance)
  steps!: WorkflowStep[];

  @OneToMany(() => WorkflowAction, (action) => action.workflowInstance)
  actions!: WorkflowAction[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
