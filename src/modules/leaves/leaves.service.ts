import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginateQb } from '../../common/http/paginate';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { WorkflowRuntimeService } from '../workflow-runtime/workflow-runtime.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
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
  ): Promise<LeaveRequest> {
    const leave = await this.leavesRepository.save(
      this.leavesRepository.create({
        requesterId: actor.userId,
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
    return leave;
  }

  list(query: LeaveQueryDto, actor: Express.User) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const adminLike = actor.roles.some((role) =>
      ['admin', 'hr-officer', 'hr-manager', 'manager'].includes(role),
    );
    const qb = this.leavesRepository
      .createQueryBuilder('leave')
      .orderBy('leave.createdAt', 'DESC');
    if (query.status)
      qb.andWhere('leave.status = :status', { status: query.status });
    if (!adminLike)
      qb.andWhere('leave.requesterId = :userId', { userId: actor.userId });
    return paginateQb(qb, { page, limit, idColumn: 'leave.id' });
  }

  async findOne(id: string, actor: Express.User): Promise<LeaveRequest> {
    const leave = await this.leavesRepository.findOneBy({ id });
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

  async update(
    id: string,
    dto: UpdateLeaveDto,
    actor: Express.User,
  ): Promise<LeaveRequest> {
    const leave = await this.findOne(id, actor);
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
    return this.leavesRepository.save(leave);
  }

  async submit(id: string, actor: Express.User): Promise<LeaveRequest> {
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
    return this.leavesRepository.save(leave);
  }

  async resubmit(
    id: string,
    dto: ResubmitLeaveDto,
    actor: Express.User,
  ): Promise<LeaveRequest> {
    const leave = await this.update(id, dto, actor);
    if (leave.status !== LeaveRequestStatus.REJECTED) {
      throw new BadRequestException('Only rejected leave can be resubmitted');
    }
    leave.status = LeaveRequestStatus.DRAFT;
    leave.rejectionReason = null;
    await this.leavesRepository.save(leave);
    return this.submit(id, actor);
  }

  private workflowMetadata(leave: LeaveRequest): Record<string, unknown> {
    return {
      leaveType: leave.leaveType,
      leaveDays: leave.leaveDays,
      startDate: leave.startDate,
      endDate: leave.endDate,
      employeeGrade: leave.employeeGrade,
      departmentId: leave.departmentId,
      customFields: leave.customFieldsJson ?? {},
    };
  }
}
