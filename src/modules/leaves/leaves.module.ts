import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { WorkflowRuntimeModule } from '../workflow-runtime/workflow-runtime.module';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveRequest]),
    AuditLogsModule,
    WorkflowRuntimeModule,
  ],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [TypeOrmModule, LeavesService],
})
export class LeavesModule {}
