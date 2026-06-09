import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UpdateWorkflowRuleDto } from './dto/update-workflow-rule.dto';
import { WorkflowRuleService } from './workflow-rule.service';

@ApiTags('workflow-rules')
@ApiCookieAuth('access_token')
@Controller('workflow-rules')
@Permissions('workflow.builder.manage')
export class WorkflowRuleController {
  constructor(private readonly workflowRuleService: WorkflowRuleService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowRuleDto) {
    return this.workflowRuleService.updateRule(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.workflowRuleService.deleteRule(id);
  }
}
