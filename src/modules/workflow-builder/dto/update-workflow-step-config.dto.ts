import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowStepConfigDto } from './create-workflow-step-config.dto';

export class UpdateWorkflowStepConfigDto extends PartialType(
  CreateWorkflowStepConfigDto,
) {}
