import { Injectable } from '@nestjs/common';
import { WorkflowInstance } from './entities/workflow-instance.entity';

@Injectable()
export class OutcomeHandlerService {
  async handleApproved(_instance: WorkflowInstance): Promise<void> {
    return;
  }

  async handleRejected(
    _instance: WorkflowInstance,
    _reason: string,
  ): Promise<void> {
    return;
  }
}
