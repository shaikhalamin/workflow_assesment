import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiData } from '../../common/http/swagger';
import {
  AccountsDashboardResponseDto,
  AdminDashboardResponseDto,
  ApproverDashboardResponseDto,
  EmployeeDashboardResponseDto,
  FinanceDashboardResponseDto,
  HrDashboardResponseDto,
} from './dto/dashboard-response.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiCookieAuth('access_token')
@Controller('dashboard')
@Permissions('dashboard.read')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @ApiData(AdminDashboardResponseDto, { errors: [401, 403] })
  admin() {
    return this.dashboardService.admin();
  }

  @Get('employee')
  @ApiData(EmployeeDashboardResponseDto, { errors: [401, 403] })
  employee(@CurrentUser() actor: Express.User) {
    return this.dashboardService.employee(actor);
  }

  @Get('approver')
  @ApiData(ApproverDashboardResponseDto, { errors: [401, 403] })
  approver(@CurrentUser() actor: Express.User) {
    return this.dashboardService.approver(actor);
  }

  @Get('accounts')
  @ApiData(AccountsDashboardResponseDto, { errors: [401, 403] })
  accounts() {
    return this.dashboardService.accounts();
  }

  @Get('finance')
  @ApiData(FinanceDashboardResponseDto, { errors: [401, 403] })
  finance() {
    return this.dashboardService.finance();
  }

  @Get('hr')
  @ApiData(HrDashboardResponseDto, { errors: [401, 403] })
  hr() {
    return this.dashboardService.hr();
  }
}
