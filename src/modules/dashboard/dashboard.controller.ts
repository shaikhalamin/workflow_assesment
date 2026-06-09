import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiOkData } from '../../common/http/swagger';
import {
  AccountsDashboardResponseDto,
  AdminDashboardResponseDto,
  ApproverDashboardResponseDto,
  EmployeeDashboardResponseDto,
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
  @ApiOkData(AdminDashboardResponseDto)
  admin() {
    return this.dashboardService.admin();
  }

  @Get('employee')
  @ApiOkData(EmployeeDashboardResponseDto)
  employee(@CurrentUser() actor: Express.User) {
    return this.dashboardService.employee(actor);
  }

  @Get('approver')
  @ApiOkData(ApproverDashboardResponseDto)
  approver(@CurrentUser() actor: Express.User) {
    return this.dashboardService.approver(actor);
  }

  @Get('accounts')
  @ApiOkData(AccountsDashboardResponseDto)
  accounts() {
    return this.dashboardService.accounts();
  }

  @Get('hr')
  @ApiOkData(HrDashboardResponseDto)
  hr() {
    return this.dashboardService.hr();
  }
}
