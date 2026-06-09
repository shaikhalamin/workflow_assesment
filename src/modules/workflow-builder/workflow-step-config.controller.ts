import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateWorkflowStepConfigDto } from './dto/create-workflow-step-config.dto';
import { UpdateWorkflowStepConfigDto } from './dto/update-workflow-step-config.dto';
import { WorkflowRuleService } from './workflow-rule.service';

@ApiTags('workflow-step-configs')
@ApiCookieAuth('access_token')
@Permissions('workflow.builder.manage')
export class WorkflowStepConfigController {
  constructor(private readonly workflowRuleService: WorkflowRuleService) {}

  @Post('workflow-rules/:id/steps')
  create(@Param('id') id: string, @Body() dto: CreateWorkflowStepConfigDto) {
    return this.workflowRuleService.createStep(id, dto);
  }

  @Patch('workflow-step-configs/:id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowStepConfigDto) {
    return this.workflowRuleService.updateStep(id, dto);
  }

  @Delete('workflow-step-configs/:id')
  delete(@Param('id') id: string) {
    return this.workflowRuleService.deleteStep(id);
  }
}
