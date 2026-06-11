import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginateQb } from '../../common/http/paginate';
import { Paginated } from '../../common/http/paginated';
import { SuccessResponseDto } from '../../common/http/success-response.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { WorkflowRuntimeService } from '../workflow-runtime/workflow-runtime.service';
import { WorkflowUserResponseDto } from '../workflow-runtime/dto/workflow-runtime-response.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { LeaveResponseDto } from './dto/leave-response.dto';
import { LeaveQueryDto } from './dto/leave-query.dto';
import { ResubmitLeaveDto } from './dto/resubmit-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import {
  LeaveRequest,
  LeaveRequestStatus,
} from './entities/leave-request.entity';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leavesRepository: Repository<LeaveRequest>,
    private readonly workflowRuntimeService: WorkflowRuntimeService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    dto: CreateLeaveDto,
    actor: Express.User,
  ): Promise<LeaveResponseDto> {
    const leave = await this.leavesRepository.save(
      this.leavesRepository.create({
        requesterId: actor.userId,
        createdById: actor.userId,
        departmentId: dto.departmentId ?? null,
        leaveType: dto.leaveType,
        leaveDays: dto.leaveDays,
        startDate: dto.startDate,
        endDate: dto.endDate,
        reason: dto.reason ?? null,
        employeeGrade: dto.employeeGrade ?? null,
        status: LeaveRequestStatus.DRAFT,
        customFieldsJson: dto.customFieldsJson ?? null,
      }),
    );
    await this.auditLogsService.record?.({
      actorUserId: actor.userId,
      action: 'LEAVE_CREATED',
      entityType: 'LeaveRequest',
      entityId: leave.id,
    });
    return this.findOne(leave.id, actor);
  }

  async list(
    query: LeaveQueryDto,
    actor: Express.User,
  ): Promise<Paginated<LeaveResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const adminLike = actor.roles.some((role) =>
      ['admin', 'hr-officer', 'hr-manager', 'manager'].includes(role),
    );
    const qb = this.leavesRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.requester', 'requester')
      .leftJoinAndSelect('leave.createdBy', 'createdBy')
      .orderBy('leave.createdAt', 'DESC');
    if (query.status)
      qb.andWhere('leave.status = :status', { status: query.status });
    if (!adminLike)
      qb.andWhere('leave.requesterId = :userId', { userId: actor.userId });
    const paginated = await paginateQb(qb, {
      page,
      limit,
      idColumn: 'leave.id',
    });
    return new Paginated(
      paginated.items.map((leave) => this.toResponse(leave)),
      paginated.page,
      paginated.limit,
      paginated.total,
    );
  }

  async findOne(id: string, actor: Express.User): Promise<LeaveResponseDto> {
    return this.toResponse(await this.findVisibleLeave(id, actor, true));
  }

  async update(
    id: string,
    dto: UpdateLeaveDto,
    actor: Express.User,
  ): Promise<LeaveResponseDto> {
    const leave = await this.findVisibleLeave(id, actor, false);
    if (leave.requesterId !== actor.userId) {
      throw new BadRequestException('Only requester can update leave');
    }
    if (
      ![LeaveRequestStatus.DRAFT, LeaveRequestStatus.REJECTED].includes(
        leave.status,
      )
    ) {
      throw new BadRequestException(
        'Only draft or rejected leave can be updated',
      );
    }
    Object.assign(leave, dto);
    await this.auditLogsService.record?.({
      actorUserId: actor.userId,
      action: 'LEAVE_UPDATED',
      entityType: 'LeaveRequest',
      entityId: leave.id,
    });
    await this.leavesRepository.save(leave);
    return this.findOne(id, actor);
  }

  async submit(id: string, actor: Express.User): Promise<LeaveResponseDto> {
    const leave = await this.leavesRepository.findOneBy({ id });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.requesterId !== actor.userId) {
      throw new BadRequestException('Only requester can submit leave');
    }
    if (leave.status !== LeaveRequestStatus.DRAFT) {
      throw new BadRequestException('Only draft leave can be submitted');
    }

    const result = await this.workflowRuntimeService.trigger({
      moduleName: 'leaves',
      eventName: 'leave.submitted',
      entityType: 'LeaveRequest',
      entityId: leave.id,
      requesterId: leave.requesterId,
      departmentId: leave.departmentId,
      metadata: this.workflowMetadata(leave),
    });

    leave.status = LeaveRequestStatus.UNDER_REVIEW;
    leave.workflowInstanceId =
      'workflowInstanceId' in result &&
      typeof result.workflowInstanceId === 'string'
        ? result.workflowInstanceId
        : null;
    leave.submittedAt = new Date();
    await this.auditLogsService.record?.({
      actorUserId: actor.userId,
      action: 'LEAVE_SUBMITTED',
      entityType: 'LeaveRequest',
      entityId: leave.id,
      workflowInstanceId: leave.workflowInstanceId,
      oldStatus: LeaveRequestStatus.DRAFT,
      newStatus: LeaveRequestStatus.UNDER_REVIEW,
    });
    return this.toResponse(await this.leavesRepository.save(leave));
  }

  async resubmit(
    id: string,
    dto: ResubmitLeaveDto,
    actor: Express.User,
  ): Promise<LeaveResponseDto> {
    await this.update(id, dto, actor);
    const leave = await this.findVisibleLeave(id, actor, false);
    if (leave.status !== LeaveRequestStatus.REJECTED) {
      throw new BadRequestException('Only rejected leave can be resubmitted');
    }
    leave.status = LeaveRequestStatus.DRAFT;
    leave.rejectionReason = null;
    await this.leavesRepository.save(leave);
    return this.submit(id, actor);
  }

  async delete(id: string, actor: Express.User): Promise<SuccessResponseDto> {
    const leave = await this.leavesRepository.findOneBy({ id });
    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.requesterId !== actor.userId) {
      throw new BadRequestException('Only requester can delete leave');
    }
    if (leave.status !== LeaveRequestStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft leave can be deleted before approval submission',
      );
    }

    await this.auditLogsService.record?.({
      actorUserId: actor.userId,
      action: 'LEAVE_DELETED',
      entityType: 'LeaveRequest',
      entityId: leave.id,
      oldStatus: leave.status,
    });
    await this.leavesRepository.remove(leave);
    return { success: true };
  }

  private async findVisibleLeave(
    id: string,
    actor: Express.User,
    withUsers: boolean,
  ): Promise<LeaveRequest> {
    const leave = withUsers
      ? await this.leavesRepository.findOne({
          where: { id },
          relations: { createdBy: true, requester: true },
        })
      : await this.leavesRepository.findOneBy({ id });
    if (!leave) throw new NotFoundException('Leave request not found');

    const adminLike = actor.roles.some((role) =>
      ['admin', 'hr-officer', 'hr-manager', 'manager'].includes(role),
    );
    if (!adminLike && leave.requesterId !== actor.userId) {
      throw new BadRequestException(
        'Leave request is not visible to this user',
      );
    }
    return leave;
  }

  private workflowMetadata(leave: LeaveRequest): Record<string, unknown> {
    return {
      title: `${this.humanizeLeaveType(leave.leaveType)} leave request`,
      leaveType: leave.leaveType,
      leaveDays: leave.leaveDays,
      startDate: leave.startDate,
      endDate: leave.endDate,
      employeeGrade: leave.employeeGrade,
      departmentId: leave.departmentId,
      customFields: leave.customFieldsJson ?? {},
    };
  }

  private toResponse(leave: LeaveRequest): LeaveResponseDto {
    return {
      id: leave.id,
      requesterId: leave.requesterId,
      requester: this.toWorkflowUserResponse(leave.requester),
      createdById: leave.createdById,
      createdBy: this.toWorkflowUserResponse(leave.createdBy),
      departmentId: leave.departmentId,
      leaveType: leave.leaveType,
      leaveDays: leave.leaveDays,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      employeeGrade: leave.employeeGrade,
      status: leave.status,
      workflowInstanceId: leave.workflowInstanceId,
      rejectionReason: leave.rejectionReason,
      approvedPeriodJson: leave.approvedPeriodJson,
      customFieldsJson: leave.customFieldsJson,
      submittedAt: this.toIsoStringOrNull(leave.submittedAt),
      approvedAt: this.toIsoStringOrNull(leave.approvedAt),
      rejectedAt: this.toIsoStringOrNull(leave.rejectedAt),
      createdAt: leave.createdAt.toISOString(),
      updatedAt: leave.updatedAt.toISOString(),
    };
  }

  private toWorkflowUserResponse(
    user: { id: string; name: string; email: string } | null | undefined,
  ): WorkflowUserResponseDto | null {
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  private toIsoStringOrNull(value: Date | null): string | null {
    return value ? value.toISOString() : null;
  }

  private humanizeLeaveType(value: string): string {
    return value
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
