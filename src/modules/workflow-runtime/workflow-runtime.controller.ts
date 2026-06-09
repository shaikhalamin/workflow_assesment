import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import { ApiOkData, ApiOkPaginated } from '../../common/http/swagger';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import { WorkflowActionDto } from './dto/workflow-action.dto';
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
  @ApiOkData(WorkflowInstanceResponseDto, { status: 201 })
  trigger(@Body() dto: TriggerWorkflowDto) {
    return this.workflowRuntimeService.trigger(dto);
  }

  @Get('workflow-instances')
  @Permissions('workflow.runtime.act')
  @ApiOkPaginated(WorkflowInstanceResponseDto)
  list(@Query() query: PaginationQueryDto) {
    return this.workflowRuntimeService.list(query);
  }

  @Get('workflow-instances/:id')
  @Permissions('workflow.runtime.act')
  @ApiOkData(WorkflowInstanceResponseDto)
  findOne(@Param('id') id: string) {
    return this.workflowRuntimeService.findOne(id);
  }

  @Get('workflow-tasks/my-pending')
  @Permissions('workflow.runtime.act')
  @ApiOkData(WorkflowStepResponseDto, { isArray: true })
  myPending(@CurrentUser() actor: Express.User) {
    return this.workflowRuntimeService.myPending(actor);
  }

  @Post('workflow-steps/:id/approve')
  @Permissions('workflow.runtime.act')
  @ApiOkData(WorkflowStepResponseDto, { status: 201 })
  approve(
    @Param('id') id: string,
    @CurrentUser() actor: Express.User,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.workflowRuntimeService.approveStep(id, actor, dto);
  }

  @Post('workflow-steps/:id/reject')
  @Permissions('workflow.runtime.act')
  @ApiOkData(WorkflowStepResponseDto, { status: 201 })
  reject(
    @Param('id') id: string,
    @CurrentUser() actor: Express.User,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.workflowRuntimeService.rejectStep(id, actor, dto);
  }

  @Post('workflow-steps/:id/comment')
  @Permissions('workflow.runtime.act')
  @ApiOkData(WorkflowActionResponseDto, { status: 201 })
  comment(
    @Param('id') id: string,
    @CurrentUser() actor: Express.User,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.workflowRuntimeService.commentStep(id, actor, dto);
  }
}
