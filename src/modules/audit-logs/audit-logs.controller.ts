import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { ApiPaginatedData } from '../../common/http/swagger';
import { AuditLogsService } from './audit-logs.service';
import {
  AuditLogEntityParamDto,
  AuditLogWorkflowParamDto,
} from './dto/audit-log-param.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';

@ApiTags('audit-logs')
@ApiCookieAuth('access_token')
@Controller('audit-logs')
@Permissions('audit.read')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiPaginatedData(AuditLogResponseDto, { errors: [400, 401, 403] })
  list(@Query() query: PaginationQueryDto, @CurrentUser() actor: Express.User) {
    return this.auditLogsService.list(query, actor);
  }

  @Get('entity/:entityType/:entityId')
  @ApiPaginatedData(AuditLogResponseDto, { errors: [400, 401, 403] })
  listForEntity(
    @Param() params: AuditLogEntityParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.auditLogsService.listForEntity(
      params.entityType,
      params.entityId,
      query,
    );
  }

  @Get('workflow/:workflowInstanceId')
  @ApiPaginatedData(AuditLogResponseDto, { errors: [400, 401, 403] })
  listForWorkflow(
    @Param() params: AuditLogWorkflowParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.auditLogsService.listForWorkflow(
      params.workflowInstanceId,
      query,
    );
  }
}
