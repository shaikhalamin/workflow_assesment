import { ApiProperty } from '@nestjs/swagger';

class EmployeeExpenseSummaryDto {
  @ApiProperty({ example: 3 })
  draft!: number;

  @ApiProperty({ example: 2 })
  underReview!: number;
}

class EmployeeLeaveSummaryDto {
  @ApiProperty({ example: 4 })
  approved!: number;

  @ApiProperty({ example: 1 })
  underReview!: number;
}

class AdminWorkflowSummaryDto {
  @ApiProperty({ example: 8 })
  active!: number;

  @ApiProperty({ example: 42 })
  approved!: number;

  @ApiProperty({ example: 3 })
  rejected!: number;
}

class HrLeaveCountsDto {
  @ApiProperty({ example: 18 })
  approved!: number;

  @ApiProperty({ example: 2 })
  rejected!: number;
}

class DashboardRecentItemDto {
  @ApiProperty({ example: 'expense-2026-0001' })
  id!: string;

  @ApiProperty({ example: 'Expense' })
  type!: string;

  @ApiProperty({ example: 'Laptop charger reimbursement' })
  title!: string;

  @ApiProperty({ example: '2026-06-10T09:30:00.000Z' })
  createdAt!: string;
}

export class EmployeeDashboardResponseDto {
  @ApiProperty({ type: EmployeeExpenseSummaryDto })
  expenses!: EmployeeExpenseSummaryDto;

  @ApiProperty({ type: EmployeeLeaveSummaryDto })
  leaves!: EmployeeLeaveSummaryDto;

  @ApiProperty({ type: [DashboardRecentItemDto] })
  recentItems!: DashboardRecentItemDto[];
}

export class AdminDashboardResponseDto {
  @ApiProperty({ type: AdminWorkflowSummaryDto })
  workflows!: AdminWorkflowSummaryDto;

  @ApiProperty({ type: [DashboardRecentItemDto] })
  recentWorkflowChanges!: DashboardRecentItemDto[];

  @ApiProperty({ example: 1 })
  failedTriggers!: number;
}

export class ApproverDashboardResponseDto {
  @ApiProperty({ example: 5 })
  pendingTasks!: number;

  @ApiProperty({ example: 21 })
  actedTasks!: number;

  @ApiProperty({ example: 0 })
  overdueTasks!: number;

  @ApiProperty({ example: 4 })
  averageApprovalTimeHours!: number;
}

export class AccountsDashboardResponseDto {
  @ApiProperty({ example: 6 })
  accountsReviewTasks!: number;

  @ApiProperty({ example: 9 })
  pendingPayments!: number;

  @ApiProperty({ example: 120000 })
  paidAmountThisMonth!: number;
}

export class HrDashboardResponseDto {
  @ApiProperty({ example: 7 })
  leaveTasks!: number;

  @ApiProperty({ type: HrLeaveCountsDto })
  leaveCounts!: HrLeaveCountsDto;
}
