import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { FindOptionsWhere } from 'typeorm';
import { Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Expense, ExpenseStatus } from '../expenses/entities/expense.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { paginateRepo } from '../../common/http/paginate';
import { Paginated } from '../../common/http/paginated';
import { PaginationQueryDto } from '../../common/http/pagination.query';
import {
  PaymentRequest,
  PaymentRequestStatus,
} from './entities/payment-request.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentsRepository: Repository<PaymentRequest>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list(
    query: PaginationQueryDto,
    actor: Express.User,
  ): Promise<Paginated<PaymentRequest>> {
    this.assertCanReadPayments(actor);
    const where: FindOptionsWhere<PaymentRequest> | undefined =
      this.canReadAllPayments(actor)
        ? undefined
        : { requesterId: actor.userId };

    return paginateRepo(this.paymentsRepository, {
      page: query.page ?? 1,
      limit: query.limit ?? 25,
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: Express.User): Promise<PaymentRequest> {
    this.assertCanReadPayments(actor);
    const payment = await this.findExistingPayment(id);
    if (
      this.canReadAllPayments(actor) ||
      payment.requesterId === actor.userId
    ) {
      return payment;
    }
    throw new BadRequestException(
      'Payment request is not visible to this user',
    );
  }

  private async findExistingPayment(id: string): Promise<PaymentRequest> {
    const payment = await this.paymentsRepository.findOneBy({ id });
    if (!payment) throw new NotFoundException('Payment request not found');
    return payment;
  }

  async markPaid(
    id: string,
    actor: Express.User,
    dto: { paymentReference?: string },
  ): Promise<PaymentRequest> {
    const payment = await this.findExistingPayment(id);
    if (payment.status !== PaymentRequestStatus.PENDING) {
      throw new BadRequestException('Only pending payments can be marked paid');
    }
    const expense = await this.expensesRepository.findOneBy({
      id: payment.expenseId,
    });
    if (!expense) throw new NotFoundException('Linked expense not found');

    payment.status = PaymentRequestStatus.PAID;
    payment.paidById = actor.userId;
    payment.paidAt = new Date();
    payment.paymentReference = dto.paymentReference ?? null;
    expense.status = ExpenseStatus.PAID;
    expense.paidAt = payment.paidAt;
    await this.expensesRepository.save(expense);
    await this.auditLogsService.record({
      actorUserId: actor.userId,
      action: 'PAYMENT_REQUEST_PAID',
      entityType: 'PaymentRequest',
      entityId: payment.id,
      oldStatus: PaymentRequestStatus.PENDING,
      newStatus: PaymentRequestStatus.PAID,
      metadataJson: { expenseId: expense.id },
    });
    await this.notificationsService.createPaymentPaid({
      recipientUserId: expense.requesterId,
      entityType: 'PaymentRequest',
      entityId: payment.id,
    });
    return this.paymentsRepository.save(payment);
  }

  private assertCanReadPayments(actor: Express.User): void {
    if (this.canReadAllPayments(actor) || this.canReadOwnPayments(actor))
      return;
    throw new ForbiddenException('Insufficient permission');
  }

  private canReadAllPayments(actor: Express.User): boolean {
    return actor.permissions.includes('payments.read');
  }

  private canReadOwnPayments(actor: Express.User): boolean {
    return actor.permissions.includes('expenses.read');
  }
}
