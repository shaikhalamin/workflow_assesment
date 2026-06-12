import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { ApiData, ApiPaginatedData } from '../../common/http/swagger';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import { WorkflowActionDto } from './dto/workflow-action.dto';
import {
  WorkflowInstanceParamDto,
  WorkflowStepParamDto,
} from './dto/workflow-runtime-param.dto';
import {
  WorkflowActionResponseDto,
  WorkflowInstanceResponseDto,
  WorkflowStepResponseDto,
} from './dto/workflow-runtime-response.dto';
import { WorkflowRuntimeService } from './workflow-runtime.service';

@ApiTags('workflow-runtime')
@ApiCookieAuth('access_token')
@Controller()
export class WorkflowRuntimeController {
  constructor(
    private readonly workflowRuntimeService: WorkflowRuntimeService,
  ) {}

  @Post('workflow-runtime/trigger')
  @Permissions('workflow.builder.manage')
  @ApiData(WorkflowInstanceResponseDto, {
    status: 201,
    errors: [400, 401, 403],
  })
  trigger(@Body() dto: TriggerWorkflowDto) {
    return this.workflowRuntimeService.trigger(dto);
  }

  @Get('workflow-instances')
  @Permissions('workflow.runtime.read')
  @ApiPaginatedData(WorkflowInstanceResponseDto, {
    errors: [400, 401, 403],
  })
  list(@Query() query: PaginationQueryDto) {
    return this.workflowRuntimeService.list(query);
  }

  @Get('workflow-instances/:id')
  @Permissions('workflow.runtime.read')
  @ApiData(WorkflowInstanceResponseDto, { errors: [400, 401, 403, 404] })
  findOne(@Param() params: WorkflowInstanceParamDto) {
    return this.workflowRuntimeService.findOne(params.id);
  }

  @Get('workflow-tasks/my-pending')
  @Permissions('workflow.runtime.act')
  @ApiData(WorkflowStepResponseDto, {
    isArray: true,
    errors: [401, 403],
  })
  myPending(@CurrentUser() actor: Express.User) {
    return this.workflowRuntimeService.myPending(actor);
  }

  @Post('workflow-steps/:id/approve')
  @Permissions('workflow.runtime.act')
  @ApiData(WorkflowStepResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  approve(
    @Param() params: WorkflowStepParamDto,
    @CurrentUser() actor: Express.User,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.workflowRuntimeService.approveStep(params.id, actor, dto);
  }

  @Post('workflow-steps/:id/reject')
  @Permissions('workflow.runtime.act')
  @ApiData(WorkflowStepResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  reject(
    @Param() params: WorkflowStepParamDto,
    @CurrentUser() actor: Express.User,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.workflowRuntimeService.rejectStep(params.id, actor, dto);
  }

  @Post('workflow-steps/:id/comment')
  @Permissions('workflow.runtime.act')
  @ApiData(WorkflowActionResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  comment(
    @Param() params: WorkflowStepParamDto,
    @CurrentUser() actor: Express.User,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.workflowRuntimeService.commentStep(params.id, actor, dto);
  }
}
