import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { WorkflowEventFieldSchema } from '../condition.types';

@Entity({ name: 'workflow_event_schemas' })
@Unique(['moduleName', 'eventName', 'entityType'])
export class WorkflowEventSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  moduleName!: string;

  @Column()
  eventName!: string;

  @Column()
  entityType!: string;

  @Column({ type: 'jsonb' })
  fieldSchemaJson!: WorkflowEventFieldSchema;

  @Column({ type: 'jsonb', nullable: true })
  outcomeActionsJson!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  assigneeResolversJson!: Record<string, unknown> | null;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
