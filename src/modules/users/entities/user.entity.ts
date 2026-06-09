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
import { Department } from '../../departments/entities/department.entity';

@Entity({ name: 'users' })
@Unique(['email'])
@Unique(['employeeCode'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', nullable: true })
  employeeCode!: string | null;

  @Column({ type: 'varchar', nullable: true })
  employeeGrade!: string | null;

  @Column({ type: 'varchar', nullable: true })
  designation!: string | null;

  @Column({ type: 'uuid', nullable: true })
  departmentId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  managerId!: string | null;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department!: Department | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'managerId' })
  manager!: User | null;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
