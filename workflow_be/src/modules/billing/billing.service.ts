import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { paginateQb } from '../../common/http/paginate';
import { Paginated } from '../../common/http/paginated';
import { SuccessResponseDto } from '../../common/http/success-response.dto';
import {
  canResubmit,
  toIsoStringOrNull,
  toWorkflowUserResponse,
} from '../../common/workflow.utils';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  TriggerWorkflowResult,
  WorkflowRuntimeService,
} from '../workflow-runtime/workflow-runtime.service';
import { BillingRequestQueryDto } from './dto/billing-request-query.dto';
import { BillingRequestResponseDto } from './dto/billing-request-response.dto';
import { CreateBillingRequestDto } from './dto/create-billing-request.dto';
import { ResubmitBillingRequestDto } from './dto/resubmit-billing-request.dto';
import { UpdateBillingRequestDto } from './dto/update-billing-request.dto';
import {
  BillingRequest,
  BillingRequestStatus,
} from './entities/billing-request.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingRequest)
    private readonly billingRequestsRepository: Repository<BillingRequest>,
    private readonly workflowRuntimeService: WorkflowRuntimeService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    dto: CreateBillingRequestDto,
    actor: Express.User,
  ): Promise<BillingRequestResponseDto> {
    const billingRequest = await this.billingRequestsRepository.save(
      this.billingRequestsRepository.create({
        requesterId: actor.userId,
        createdById: actor.userId,
        departmentId: dto.departmentId ?? null,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail ?? null,
        customerAddress: dto.customerAddress ?? null,
        title: dto.title,
        description: dto.description ?? null,
        amount: String(dto.amount),
        currency: dto.currency ?? 'BDT',
        billingCategory: dto.billingCategory,
        status: BillingRequestStatus.DRAFT,
        customFieldsJson: dto.customFieldsJson ?? null,
      }),
    );
    await this.auditLogsService.record({
      actorUserId: actor.userId,
      action: 'BILLING_REQUEST_CREATED',
      entityType: 'BillingRequest',
      entityId: billingRequest.id,
      metadataJson: { amount: billingRequest.amount },
    });
    return this.findOne(billingRequest.id, actor);
  }

  async list(
    query: BillingRequestQueryDto,
    actor: Express.User,
  ): Promise<Paginated<BillingRequestResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const qb = this.billingRequestsRepository
      .createQueryBuilder('billingRequest')
      .leftJoinAndSelect('billingRequest.requester', 'requester')
      .leftJoinAndSelect('billingRequest.createdBy', 'createdBy')
      .orderBy('billingRequest.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('billingRequest.status = :status', { status: query.status });
    }

    if (!this.isAdmin(actor) && !this.isManager(actor)) {
      const assignedBillingRequestIds =
        await this.workflowRuntimeService.assignedEntityIdsForActor(
          'BillingRequest',
          actor,
        );
      qb.andWhere(
        new Brackets((where) => {
          where.where('billingRequest.requesterId = :userId', {
            userId: actor.userId,
          });
          if (this.isAccountsOrFinance(actor)) {
            where.orWhere('billingRequest.status = :reviewStatus', {
              reviewStatus: BillingRequestStatus.UNDER_REVIEW,
            });
          }
          if (assignedBillingRequestIds.length) {
            where.orWhere(
              'billingRequest.id IN (:...assignedBillingRequestIds)',
              { assignedBillingRequestIds },
            );
          }
        }),
      );
    }

    const paginated = await paginateQb(qb, {
      page,
      limit,
      idColumn: 'billingRequest.id',
    });
    return new Paginated(
      await Promise.all(
        paginated.items.map((billingRequest) =>
          this.toResponse(billingRequest),
        ),
      ),
      paginated.page,
      paginated.limit,
      paginated.total,
    );
  }

  async findOne(
    id: string,
    actor: Express.User,
  ): Promise<BillingRequestResponseDto> {
    return this.toResponse(
      await this.findVisibleBillingRequest(id, actor, true),
    );
  }

  async update(
    id: string,
    dto: UpdateBillingRequestDto,
    actor: Express.User,
  ): Promise<BillingRequestResponseDto> {
    const billingRequest = await this.findVisibleBillingRequest(
      id,
      actor,
      false,
    );
    if (!this.isAdmin(actor) && billingRequest.requesterId !== actor.userId) {
      throw new BadRequestException(
        'Only requester can update billing request',
      );
    }
    if (
      ![BillingRequestStatus.DRAFT, BillingRequestStatus.REJECTED].includes(
        billingRequest.status,
      )
    ) {
      throw new BadRequestException(
        'Only draft or rejected billing requests can be updated',
      );
    }
    Object.assign(billingRequest, this.mapUpdate(dto));
    await this.auditLogsService.record({
      actorUserId: actor.userId,
      action: 'BILLING_REQUEST_UPDATED',
      entityType: 'BillingRequest',
      entityId: billingRequest.id,
    });
    await this.billingRequestsRepository.save(billingRequest);
    return this.findOne(id, actor);
  }

  async submit(
    id: string,
    actor: Express.User,
  ): Promise<BillingRequestResponseDto> {
    const billingRequest = await this.billingRequestsRepository.findOneBy({
      id,
    });
    if (!billingRequest)
      throw new NotFoundException('Billing request not found');
    if (!this.isAdmin(actor) && billingRequest.requesterId !== actor.userId) {
      throw new BadRequestException(
        'Only requester can submit billing request',
      );
    }
    if (
      ![BillingRequestStatus.DRAFT, BillingRequestStatus.REJECTED].includes(
        billingRequest.status,
      )
    ) {
      throw new BadRequestException(
        'Only draft or rejected billing requests can be submitted',
      );
    }
    if (
      billingRequest.status === BillingRequestStatus.REJECTED &&
      !(await canResubmit(
        billingRequest,
        BillingRequestStatus.REJECTED,
        (workflowInstanceId) =>
          this.workflowRuntimeService.allowsResubmission(workflowInstanceId),
      ))
    ) {
      throw new BadRequestException(
        'This billing workflow does not allow resubmission',
      );
    }

    const oldStatus = billingRequest.status;
    const oldSubmittedAt = billingRequest.submittedAt;
    const oldRejectionReason = billingRequest.rejectionReason;
    billingRequest.status = BillingRequestStatus.UNDER_REVIEW;
    billingRequest.submittedAt = new Date();
    billingRequest.rejectionReason = null;
    await this.billingRequestsRepository.save(billingRequest);

    let result: TriggerWorkflowResult;
    try {
      result = await this.workflowRuntimeService.trigger({
        moduleName: 'billing',
        eventName: 'billing.submitted',
        entityType: 'BillingRequest',
        entityId: billingRequest.id,
        requesterId: billingRequest.requesterId,
        departmentId: billingRequest.departmentId,
        metadata: this.workflowMetadata(billingRequest),
      });
    } catch (error: unknown) {
      await this.restoreSubmitState(
        billingRequest,
        oldStatus,
        oldSubmittedAt,
        oldRejectionReason,
      );
      throw error;
    }
    if (result.status !== 'triggered') {
      await this.restoreSubmitState(
        billingRequest,
        oldStatus,
        oldSubmittedAt,
        oldRejectionReason,
      );
      throw new BadRequestException(
        'No published workflow applies to this billing request',
      );
    }

    billingRequest.workflowInstanceId = result.workflowInstanceId;
    await this.auditLogsService.record({
      actorUserId: actor.userId,
      action:
        oldStatus === BillingRequestStatus.REJECTED
          ? 'BILLING_REQUEST_RESUBMITTED'
          : 'BILLING_REQUEST_SUBMITTED',
      entityType: 'BillingRequest',
      entityId: billingRequest.id,
      workflowInstanceId: billingRequest.workflowInstanceId,
      oldStatus,
      newStatus: BillingRequestStatus.UNDER_REVIEW,
    });
    await this.billingRequestsRepository.save(billingRequest);
    return this.findOne(id, actor);
  }

  async resubmit(
    id: string,
    dto: ResubmitBillingRequestDto,
    actor: Express.User,
  ): Promise<BillingRequestResponseDto> {
    const billingRequest = await this.findVisibleBillingRequest(
      id,
      actor,
      false,
    );
    if (billingRequest.status !== BillingRequestStatus.REJECTED) {
      throw new BadRequestException(
        'Only rejected billing requests can be resubmitted',
      );
    }
    await this.update(id, dto, actor);
    return this.submit(id, actor);
  }

  async cancel(id: string, actor: Express.User): Promise<SuccessResponseDto> {
    const billingRequest = await this.findVisibleBillingRequest(
      id,
      actor,
      false,
    );
    if (!this.isAdmin(actor) && billingRequest.requesterId !== actor.userId) {
      throw new BadRequestException(
        'Only requester can cancel billing request',
      );
    }
    if (billingRequest.invoiceId) {
      throw new BadRequestException(
        'Billing request with an invoice cannot be cancelled',
      );
    }
    if (billingRequest.status === BillingRequestStatus.CANCELLED) {
      return { success: true };
    }
    const oldStatus = billingRequest.status;
    billingRequest.status = BillingRequestStatus.CANCELLED;
    await this.billingRequestsRepository.save(billingRequest);
    if (billingRequest.workflowInstanceId) {
      await this.workflowRuntimeService.cancelActiveForEntity({
        entityType: 'BillingRequest',
        entityId: billingRequest.id,
        actorUserId: actor.userId,
      });
    }
    await this.auditLogsService.record({
      actorUserId: actor.userId,
      action: 'BILLING_REQUEST_CANCELLED',
      entityType: 'BillingRequest',
      entityId: billingRequest.id,
      oldStatus,
      newStatus: BillingRequestStatus.CANCELLED,
    });
    return { success: true };
  }

  private async findVisibleBillingRequest(
    id: string,
    actor: Express.User,
    withUsers: boolean,
  ): Promise<BillingRequest> {
    const billingRequest = withUsers
      ? await this.billingRequestsRepository.findOne({
          where: { id },
          relations: { createdBy: true, requester: true },
        })
      : await this.billingRequestsRepository.findOneBy({ id });
    if (!billingRequest)
      throw new NotFoundException('Billing request not found');
    if (await this.canSeeBillingRequest(billingRequest, actor)) {
      return billingRequest;
    }
    throw new BadRequestException(
      'Billing request is not visible to this user',
    );
  }

  private async restoreSubmitState(
    billingRequest: BillingRequest,
    oldStatus: BillingRequestStatus,
    oldSubmittedAt: Date | null,
    oldRejectionReason: string | null,
  ): Promise<void> {
    billingRequest.status = oldStatus;
    billingRequest.workflowInstanceId = null;
    billingRequest.submittedAt = oldSubmittedAt;
    billingRequest.rejectionReason = oldRejectionReason;
    await this.billingRequestsRepository.save(billingRequest);
  }

  private async canSeeBillingRequest(
    billingRequest: BillingRequest,
    actor: Express.User,
  ): Promise<boolean> {
    if (this.isAdmin(actor) || billingRequest.requesterId === actor.userId) {
      return true;
    }
    if (this.isAccountsOrFinance(actor)) {
      return billingRequest.status === BillingRequestStatus.UNDER_REVIEW;
    }
    if (this.isManager(actor)) {
      return true;
    }
    return this.workflowRuntimeService.userHasEntityAssignment({
      entityType: 'BillingRequest',
      entityId: billingRequest.id,
      actor,
    });
  }

  private mapUpdate(dto: UpdateBillingRequestDto): Partial<BillingRequest> {
    return {
      title: dto.title,
      description: dto.description,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerAddress: dto.customerAddress,
      amount: dto.amount === undefined ? undefined : String(dto.amount),
      currency: dto.currency,
      billingCategory: dto.billingCategory,
      departmentId: dto.departmentId,
      customFieldsJson: dto.customFieldsJson,
    };
  }

  private workflowMetadata(
    billingRequest: BillingRequest,
  ): Record<string, unknown> {
    return {
      title: billingRequest.title,
      amount: Number(billingRequest.amount),
      currency: billingRequest.currency,
      billingCategory: billingRequest.billingCategory,
      customerName: billingRequest.customerName,
      departmentId: billingRequest.departmentId,
      customFields: billingRequest.customFieldsJson ?? {},
    };
  }

  private async toResponse(
    billingRequest: BillingRequest,
  ): Promise<BillingRequestResponseDto> {
    return {
      id: billingRequest.id,
      requesterId: billingRequest.requesterId,
      requester: toWorkflowUserResponse(billingRequest.requester),
      createdById: billingRequest.createdById,
      createdBy: toWorkflowUserResponse(billingRequest.createdBy),
      departmentId: billingRequest.departmentId,
      customerName: billingRequest.customerName,
      customerEmail: billingRequest.customerEmail,
      customerAddress: billingRequest.customerAddress,
      title: billingRequest.title,
      description: billingRequest.description,
      amount: billingRequest.amount,
      currency: billingRequest.currency,
      billingCategory: billingRequest.billingCategory,
      status: billingRequest.status,
      workflowInstanceId: billingRequest.workflowInstanceId,
      invoiceId: billingRequest.invoiceId,
      canResubmit: await canResubmit(
        billingRequest,
        BillingRequestStatus.REJECTED,
        (workflowInstanceId) =>
          this.workflowRuntimeService.allowsResubmission(workflowInstanceId),
      ),
      rejectionReason: billingRequest.rejectionReason,
      customFieldsJson: billingRequest.customFieldsJson,
      submittedAt: toIsoStringOrNull(billingRequest.submittedAt),
      approvedAt: toIsoStringOrNull(billingRequest.approvedAt),
      rejectedAt: toIsoStringOrNull(billingRequest.rejectedAt),
      createdAt: billingRequest.createdAt.toISOString(),
      updatedAt: billingRequest.updatedAt.toISOString(),
    };
  }

  private isAdmin(actor: Express.User): boolean {
    return actor.roles.includes('admin');
  }

  private isManager(actor: Express.User): boolean {
    return actor.roles.includes('manager');
  }

  private isAccountsOrFinance(actor: Express.User): boolean {
    return actor.roles.some((role) =>
      ['accounts-officer', 'finance-admin'].includes(role),
    );
  }
}
