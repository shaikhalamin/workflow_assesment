import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SuccessResponseDto } from '../../common/http/success-response.dto';
import { ApiData } from '../../common/http/swagger';
import { CreateWorkflowStepConfigDto } from './dto/create-workflow-step-config.dto';
import { UpdateWorkflowStepConfigDto } from './dto/update-workflow-step-config.dto';
import { WorkflowBuilderIdParamDto } from './dto/workflow-builder-param.dto';
import { WorkflowApprovalStepConfigResponseDto } from './dto/workflow-builder-response.dto';
import { WorkflowRuleService } from './workflow-rule.service';

@ApiTags('workflow-step-configs')
@ApiCookieAuth('access_token')
@Controller()
@Permissions('workflow.builder.manage')
export class WorkflowStepConfigController {
  constructor(private readonly workflowRuleService: WorkflowRuleService) {}

  @Post('workflow-rules/:id/steps')
  @ApiData(WorkflowApprovalStepConfigResponseDto, {
    status: 201,
    errors: [400, 401, 403, 404],
  })
  create(
    @Param() params: WorkflowBuilderIdParamDto,
    @Body() dto: CreateWorkflowStepConfigDto,
  ) {
    return this.workflowRuleService.createStep(params.id, dto);
  }

  @Patch('workflow-step-configs/:id')
  @ApiData(WorkflowApprovalStepConfigResponseDto, {
    errors: [400, 401, 403, 404],
  })
  update(
    @Param() params: WorkflowBuilderIdParamDto,
    @Body() dto: UpdateWorkflowStepConfigDto,
  ) {
    return this.workflowRuleService.updateStep(params.id, dto);
  }

  @Delete('workflow-step-configs/:id')
  @ApiData(SuccessResponseDto, { errors: [400, 401, 403, 404] })
  async delete(
    @Param() params: WorkflowBuilderIdParamDto,
  ): Promise<SuccessResponseDto> {
    await this.workflowRuleService.deleteStep(params.id);
    return { success: true };
  }
}
