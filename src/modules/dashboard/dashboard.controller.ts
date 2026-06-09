import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiCookieAuth('access_token')
@Controller('dashboard')
@Permissions('dashboard.read')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  admin() {
    return this.dashboardService.admin();
  }

  @Get('employee')
  employee(@CurrentUser() actor: Express.User) {
    return this.dashboardService.employee(actor);
  }

  @Get('approver')
  approver(@CurrentUser() actor: Express.User) {
    return this.dashboardService.approver(actor);
  }

  @Get('accounts')
  accounts() {
    return this.dashboardService.accounts();
  }

  @Get('hr')
  hr() {
    return this.dashboardService.hr();
  }
}
