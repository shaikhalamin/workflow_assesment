import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { paginateQb } from '../../common/http/paginate';
import { Paginated } from '../../common/http/paginated';
import {
  toIsoStringOrNull,
  toWorkflowUserResponse,
} from '../../common/workflow.utils';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async list(
    query: InvoiceQueryDto,
    actor: Express.User,
  ): Promise<Paginated<InvoiceResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const qb = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.requester', 'requester')
      .orderBy('invoice.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('invoice.status = :status', { status: query.status });
    }

    if (!this.isAdminOrFinance(actor) && !this.isManager(actor)) {
      qb.andWhere(
        new Brackets((where) => {
          where.where('invoice.requesterId = :userId', {
            userId: actor.userId,
          });
          if (actor.roles.includes('accounts-officer')) {
            where.orWhere('invoice.status = :issuedStatus', {
              issuedStatus: InvoiceStatus.ISSUED,
            });
          }
        }),
      );
    }

    const paginated = await paginateQb(qb, {
      page,
      limit,
      idColumn: 'invoice.id',
    });
    return new Paginated(
      paginated.items.map((invoice) => this.toResponse(invoice)),
      paginated.page,
      paginated.limit,
      paginated.total,
    );
  }

  async findOne(id: string, actor: Express.User): Promise<InvoiceResponseDto> {
    return this.toResponse(await this.findVisibleInvoice(id, actor, true));
  }

  async cancel(id: string, actor: Express.User): Promise<InvoiceResponseDto> {
    const invoice = await this.findVisibleInvoice(id, actor, false);
    if (invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException('Only issued invoices can be cancelled');
    }
    invoice.status = InvoiceStatus.CANCELLED;
    invoice.cancelledAt = new Date();
    await this.invoicesRepository.save(invoice);
    await this.auditLogsService.record({
      actorUserId: actor.userId,
      action: 'INVOICE_CANCELLED',
      entityType: 'Invoice',
      entityId: invoice.id,
      oldStatus: InvoiceStatus.ISSUED,
      newStatus: InvoiceStatus.CANCELLED,
    });
    return this.findOne(id, actor);
  }

  async markPaid(id: string, actor: Express.User): Promise<InvoiceResponseDto> {
    const invoice = await this.findVisibleInvoice(id, actor, false);
    if (invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException('Only issued invoices can be marked paid');
    }
    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();
    await this.invoicesRepository.save(invoice);
    await this.auditLogsService.record({
      actorUserId: actor.userId,
      action: 'INVOICE_PAID',
      entityType: 'Invoice',
      entityId: invoice.id,
      oldStatus: InvoiceStatus.ISSUED,
      newStatus: InvoiceStatus.PAID,
    });
    return this.findOne(id, actor);
  }

  private async findVisibleInvoice(
    id: string,
    actor: Express.User,
    withUsers: boolean,
  ): Promise<Invoice> {
    const invoice = withUsers
      ? await this.invoicesRepository.findOne({
          where: { id },
          relations: { requester: true },
        })
      : await this.invoicesRepository.findOneBy({ id });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (this.canSeeInvoice(invoice, actor)) return invoice;
    throw new BadRequestException('Invoice is not visible to this user');
  }

  private canSeeInvoice(invoice: Invoice, actor: Express.User): boolean {
    if (this.isAdminOrFinance(actor) || invoice.requesterId === actor.userId) {
      return true;
    }
    if (actor.roles.includes('accounts-officer')) {
      return invoice.status === InvoiceStatus.ISSUED;
    }
    return this.isManager(actor);
  }

  private toResponse(invoice: Invoice): InvoiceResponseDto {
    return {
      id: invoice.id,
      billingRequestId: invoice.billingRequestId,
      invoiceNumber: invoice.invoiceNumber,
      requesterId: invoice.requesterId,
      requester: toWorkflowUserResponse(invoice.requester),
      departmentId: invoice.departmentId,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerAddress: invoice.customerAddress,
      title: invoice.title,
      description: invoice.description,
      amount: invoice.amount,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      status: invoice.status,
      issuedAt: invoice.issuedAt.toISOString(),
      cancelledAt: toIsoStringOrNull(invoice.cancelledAt),
      paidAt: toIsoStringOrNull(invoice.paidAt),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }

  private isAdminOrFinance(actor: Express.User): boolean {
    return actor.roles.some((role) =>
      ['admin', 'finance-admin'].includes(role),
    );
  }

  private isManager(actor: Express.User): boolean {
    return actor.roles.includes('manager');
  }
}
