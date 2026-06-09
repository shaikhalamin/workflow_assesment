import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SuccessResponseDto } from '../../common/http/success-response.dto';
import { ApiOkData } from '../../common/http/swagger';
import { CreateWorkflowStepConfigDto } from './dto/create-workflow-step-config.dto';
import { UpdateWorkflowStepConfigDto } from './dto/update-workflow-step-config.dto';
import { WorkflowApprovalStepConfigResponseDto } from './dto/workflow-builder-response.dto';
import { WorkflowRuleService } from './workflow-rule.service';

@ApiTags('workflow-step-configs')
@ApiCookieAuth('access_token')
@Controller()
@Permissions('workflow.builder.manage')
export class WorkflowStepConfigController {
  constructor(private readonly workflowRuleService: WorkflowRuleService) {}

  @Post('workflow-rules/:id/steps')
  @ApiOkData(WorkflowApprovalStepConfigResponseDto, { status: 201 })
  create(@Param('id') id: string, @Body() dto: CreateWorkflowStepConfigDto) {
    return this.workflowRuleService.createStep(id, dto);
  }

  @Patch('workflow-step-configs/:id')
  @ApiOkData(WorkflowApprovalStepConfigResponseDto)
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowStepConfigDto) {
    return this.workflowRuleService.updateStep(id, dto);
  }

  @Delete('workflow-step-configs/:id')
  @ApiOkData(SuccessResponseDto)
  async delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    await this.workflowRuleService.deleteStep(id);
    return { success: true };
  }
}
