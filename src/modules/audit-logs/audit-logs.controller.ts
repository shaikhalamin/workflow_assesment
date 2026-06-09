import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('audit-logs')
@ApiCookieAuth('access_token')
@Controller('audit-logs')
@Permissions('audit.read')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto, @CurrentUser() actor: Express.User) {
    return this.auditLogsService.list(query, actor);
  }

  @Get('entity/:entityType/:entityId')
  listForEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.auditLogsService.listForEntity(entityType, entityId, query);
  }

  @Get('workflow/:workflowInstanceId')
  listForWorkflow(
    @Param('workflowInstanceId') workflowInstanceId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.auditLogsService.listForWorkflow(workflowInstanceId, query);
  }
}
