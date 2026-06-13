import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowEventSchemaDto } from './create-workflow-event-schema.dto';

export class UpdateWorkflowEventSchemaDto extends PartialType(
  CreateWorkflowEventSchemaDto,
) {}
