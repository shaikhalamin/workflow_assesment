import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkflowTemplate } from './workflow-template.entity';

@Entity({ name: 'workflow_outcome_configs' })
export class WorkflowOutcomeConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  workflowTemplateId!: string;

  @OneToOne(() => WorkflowTemplate, (template) => template.outcomeConfig, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflowTemplateId' })
  workflowTemplate!: WorkflowTemplate;

  @Column({ type: 'jsonb', nullable: true })
  approvedActionsJson!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  rejectedActionsJson!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
