import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SuccessResponseDto } from '../../common/http/success-response.dto';
import { ApiOkData } from '../../common/http/swagger';
import { UpdateWorkflowRuleDto } from './dto/update-workflow-rule.dto';
import { WorkflowApprovalRuleResponseDto } from './dto/workflow-builder-response.dto';
import { WorkflowRuleService } from './workflow-rule.service';

@ApiTags('workflow-rules')
@ApiCookieAuth('access_token')
@Controller('workflow-rules')
@Permissions('workflow.builder.manage')
export class WorkflowRuleController {
  constructor(private readonly workflowRuleService: WorkflowRuleService) {}

  @Patch(':id')
  @ApiOkData(WorkflowApprovalRuleResponseDto)
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowRuleDto) {
    return this.workflowRuleService.updateRule(id, dto);
  }

  @Delete(':id')
  @ApiOkData(SuccessResponseDto)
  async delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    await this.workflowRuleService.deleteRule(id);
    return { success: true };
  }
}
