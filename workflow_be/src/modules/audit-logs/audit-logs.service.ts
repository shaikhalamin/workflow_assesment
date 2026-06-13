import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginateRepo } from '../../common/http/paginate';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { AuditLog } from './entities/audit-log.entity';

export type AuditLogInput = {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  workflowInstanceId?: string | null;
  workflowStepId?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  comment?: string | null;
  reason?: string | null;
  metadataJson?: Record<string, unknown> | null;
};

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogsRepository: Repository<AuditLog>,
  ) {}

  record(
    input: AuditLogInput,
    auditLogsRepository: Repository<AuditLog> = this.auditLogsRepository,
  ): Promise<AuditLog> {
    return auditLogsRepository.save(
      auditLogsRepository.create({
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        workflowInstanceId: input.workflowInstanceId ?? null,
        workflowStepId: input.workflowStepId ?? null,
        oldStatus: input.oldStatus ?? null,
        newStatus: input.newStatus ?? null,
        comment: input.comment ?? null,
        reason: input.reason ?? null,
        metadataJson: input.metadataJson ?? null,
      }),
    );
  }

  list(query: PaginationQueryDto, actor: Express.User) {
    const isAdmin =
      actor.permissions.includes('audit.read') && actor.roles.includes('admin');
    return paginateRepo(this.auditLogsRepository, {
      page: query.page ?? 1,
      limit: query.limit ?? 25,
      order: { createdAt: 'DESC' },
      where: isAdmin ? undefined : { actorUserId: actor.userId },
    });
  }

  listForEntity(
    entityType: string,
    entityId: string,
    query: PaginationQueryDto,
  ) {
    return paginateRepo(this.auditLogsRepository, {
      page: query.page ?? 1,
      limit: query.limit ?? 25,
      order: { createdAt: 'DESC' },
      where: { entityType, entityId },
    });
  }

  listForWorkflow(workflowInstanceId: string, query: PaginationQueryDto) {
    return paginateRepo(this.auditLogsRepository, {
      page: query.page ?? 1,
      limit: query.limit ?? 25,
      order: { createdAt: 'DESC' },
      where: { workflowInstanceId },
    });
  }
}
