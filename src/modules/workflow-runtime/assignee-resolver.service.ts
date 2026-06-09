import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { WorkflowApprovalStepConfig } from '../workflow-builder/entities/workflow-approval-step-config.entity';
import { WorkflowAssigneeType } from '../workflow-builder/enums/workflow-builder.enums';

export type ResolvedAssignee = {
  assignedUserId: string | null;
  assignedRoleSlug: string | null;
};

type AssigneeContext = {
  requesterId: string;
  departmentId?: string | null;
  metadata?: Record<string, unknown> | null;
};

@Injectable()
export class AssigneeResolverService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentsRepository: Repository<Department>,
  ) {}

  async resolve(
    step: Pick<
      WorkflowApprovalStepConfig,
      | 'assigneeType'
      | 'assigneeUserId'
      | 'assigneeRoleSlug'
      | 'assigneeFieldPath'
    >,
    context: AssigneeContext,
  ): Promise<ResolvedAssignee> {
    switch (step.assigneeType) {
      case WorkflowAssigneeType.USER:
        if (!step.assigneeUserId) break;
        return { assignedUserId: step.assigneeUserId, assignedRoleSlug: null };
      case WorkflowAssigneeType.ROLE:
        if (!step.assigneeRoleSlug) break;
        return {
          assignedUserId: null,
          assignedRoleSlug: step.assigneeRoleSlug,
        };
      case WorkflowAssigneeType.REQUESTER_MANAGER: {
        const requester = await this.usersRepository.findOneBy({
          id: context.requesterId,
        });
        if (requester?.managerId) {
          return {
            assignedUserId: requester.managerId,
            assignedRoleSlug: null,
          };
        }
        break;
      }
      case WorkflowAssigneeType.DEPARTMENT_HEAD: {
        if (!context.departmentId) break;
        const department = await this.departmentsRepository.findOneBy({
          id: context.departmentId,
        });
        if (department?.headUserId) {
          return {
            assignedUserId: department.headUserId,
            assignedRoleSlug: null,
          };
        }
        break;
      }
      case WorkflowAssigneeType.CUSTOM_FIELD_USER: {
        const value = step.assigneeFieldPath
          ? this.getValue(context.metadata ?? {}, step.assigneeFieldPath)
          : null;
        if (typeof value === 'string' && value) {
          return { assignedUserId: value, assignedRoleSlug: null };
        }
        break;
      }
    }

    throw new BadRequestException('Workflow step has no concrete assignee');
  }

  private getValue(data: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((current, segment) => {
      if (
        current !== null &&
        typeof current === 'object' &&
        segment in current
      ) {
        return (current as Record<string, unknown>)[segment];
      }
      return undefined;
    }, data);
  }
}
