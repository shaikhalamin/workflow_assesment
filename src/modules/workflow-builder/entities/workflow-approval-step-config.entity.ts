import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import {
  WorkflowAssigneeType,
  WorkflowStepType,
} from '../enums/workflow-builder.enums';
import { WorkflowApprovalRule } from './workflow-approval-rule.entity';

@Entity({ name: 'workflow_approval_step_configs' })
@Unique(['workflowApprovalRuleId', 'stepOrder'])
export class WorkflowApprovalStepConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  workflowApprovalRuleId!: string;

  @ManyToOne(() => WorkflowApprovalRule, (rule) => rule.steps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflowApprovalRuleId' })
  workflowApprovalRule!: WorkflowApprovalRule;

  @Column()
  stepOrder!: number;

  @Column()
  stepName!: string;

  @Column({ type: 'enum', enum: WorkflowStepType })
  stepType!: WorkflowStepType;

  @Column({ type: 'enum', enum: WorkflowAssigneeType })
  assigneeType!: WorkflowAssigneeType;

  @Column({ nullable: true })
  assigneeRoleSlug!: string | null;

  @Column({ type: 'uuid', nullable: true })
  assigneeUserId!: string | null;

  @Column({ nullable: true })
  assigneeFieldPath!: string | null;

  @Column({ default: true })
  isRequired!: boolean;

  @Column({ default: false })
  requiresComment!: boolean;

  @Column({ default: false })
  requiresAttachment!: boolean;

  @Column({ default: true })
  canReject!: boolean;

  @Column({ default: false })
  canReassign!: boolean;

  @Column({ nullable: true })
  slaHours!: number | null;

  @Column({ type: 'enum', enum: WorkflowAssigneeType, nullable: true })
  escalationAssigneeType!: WorkflowAssigneeType | null;

  @Column({ nullable: true })
  escalationAssigneeRoleSlug!: string | null;

  @Column({ type: 'uuid', nullable: true })
  escalationAssigneeUserId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
