import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SuccessResponseDto } from '../../common/http/success-response.dto';
import { ApiData } from '../../common/http/swagger';
import { UpdateWorkflowRuleDto } from './dto/update-workflow-rule.dto';
import { WorkflowBuilderIdParamDto } from './dto/workflow-builder-param.dto';
import { WorkflowApprovalRuleResponseDto } from './dto/workflow-builder-response.dto';
import { WorkflowRuleService } from './workflow-rule.service';

@ApiTags('workflow-rules')
@ApiCookieAuth('access_token')
@Controller('workflow-rules')
@Permissions('workflow.builder.manage')
export class WorkflowRuleController {
  constructor(private readonly workflowRuleService: WorkflowRuleService) {}

  @Patch(':id')
  @ApiData(WorkflowApprovalRuleResponseDto, {
    errors: [400, 401, 403, 404],
  })
  update(
    @Param() params: WorkflowBuilderIdParamDto,
    @Body() dto: UpdateWorkflowRuleDto,
  ) {
    return this.workflowRuleService.updateRule(params.id, dto);
  }

  @Delete(':id')
  @ApiData(SuccessResponseDto, { errors: [400, 401, 403, 404] })
  async delete(
    @Param() params: WorkflowBuilderIdParamDto,
  ): Promise<SuccessResponseDto> {
    await this.workflowRuleService.deleteRule(params.id);
    return { success: true };
  }
}
