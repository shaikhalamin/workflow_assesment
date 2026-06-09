import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import { WorkflowActionDto } from './dto/workflow-action.dto';
import { WorkflowRuntimeService } from './workflow-runtime.service';

@ApiTags('workflow-runtime')
@ApiCookieAuth('access_token')
@Controller()
export class WorkflowRuntimeController {
  constructor(private readonly workflowRuntimeService: WorkflowRuntimeService) {}

  @Post('workflow-runtime/trigger')
  @Permissions('workflow.builder.manage')
  trigger(@Body() dto: TriggerWorkflowDto) {
    return this.workflowRuntimeService.trigger(dto);
  }

  @Get('workflow-instances')
  @Permissions('workflow.runtime.act')
  list(@Query() query: PaginationQueryDto) {
    return this.workflowRuntimeService.list(query);
  }

  @Get('workflow-instances/:id')
  @Permissions('workflow.runtime.act')
  findOne(@Param('id') id: string) {
    return this.workflowRuntimeService.findOne(id);
  }

  @Get('workflow-tasks/my-pending')
  @Permissions('workflow.runtime.act')
  myPending(@CurrentUser() actor: Express.User) {
    return this.workflowRuntimeService.myPending(actor);
  }

  @Post('workflow-steps/:id/approve')
  @Permissions('workflow.runtime.act')
  approve(
    @Param('id') id: string,
    @CurrentUser() actor: Express.User,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.workflowRuntimeService.approveStep(id, actor, dto);
  }

  @Post('workflow-steps/:id/reject')
  @Permissions('workflow.runtime.act')
  reject(
    @Param('id') id: string,
    @CurrentUser() actor: Express.User,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.workflowRuntimeService.rejectStep(id, actor, dto);
  }

  @Post('workflow-steps/:id/comment')
  @Permissions('workflow.runtime.act')
  comment(
    @Param('id') id: string,
    @CurrentUser() actor: Express.User,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.workflowRuntimeService.commentStep(id, actor, dto);
  }
}
