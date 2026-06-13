import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { WorkflowRuntimeModule } from '../workflow-runtime/workflow-runtime.module';
import { Expense } from './entities/expense.entity';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense]),
    AuditLogsModule,
    WorkflowRuntimeModule,
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [TypeOrmModule, ExpensesService],
})
export class ExpensesModule {}
