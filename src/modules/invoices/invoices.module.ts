import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { Invoice } from './entities/invoice.entity';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice]), AuditLogsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [TypeOrmModule, InvoicesService],
})
export class InvoicesModule {}
