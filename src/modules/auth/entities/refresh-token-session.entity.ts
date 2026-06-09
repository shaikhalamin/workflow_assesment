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
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'refresh_token_sessions' })
@Unique(['jti'])
export class RefreshTokenSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ select: false })
  tokenHash!: string;

  @Column()
  jti!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  replacedBySessionId!: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => RefreshTokenSession, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'replacedBySessionId' })
  replacedBySession!: RefreshTokenSession | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
