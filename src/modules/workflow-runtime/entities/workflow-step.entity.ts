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
import {
  WorkflowAssigneeType,
  WorkflowStepType,
} from '../../workflow-builder/enums/workflow-builder.enums';
import { WorkflowStepStatus } from '../enums/workflow-runtime.enums';
import { WorkflowAction } from './workflow-action.entity';
import { WorkflowInstance } from './workflow-instance.entity';

@Entity({ name: 'workflow_steps' })
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  workflowInstanceId!: string;

  @ManyToOne(() => WorkflowInstance, (instance) => instance.steps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflowInstanceId' })
  workflowInstance!: WorkflowInstance;

  @Column()
  stepOrder!: number;

  @Column()
  stepName!: string;

  @Column({ type: 'enum', enum: WorkflowStepType })
  stepType!: WorkflowStepType;

  @Column({ type: 'uuid', nullable: true })
  assignedUserId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  assignedRoleSlug!: string | null;

  @Column({ type: 'enum', enum: WorkflowAssigneeType })
  assigneeType!: WorkflowAssigneeType;

  @Column({
    type: 'enum',
    enum: WorkflowStepStatus,
    default: WorkflowStepStatus.WAITING,
  })
  status!: WorkflowStepStatus;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  actedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  actionByUserId!: string | null;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason!: string | null;

  @OneToMany(() => WorkflowAction, (action) => action.workflowStep)
  actions!: WorkflowAction[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
