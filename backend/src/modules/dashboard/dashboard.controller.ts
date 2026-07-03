import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('candidate-summary')
  getCandidateSummary(@CurrentUser() user: UserSession) {
    return this.dashboardService.getCandidateSummary(user.user.id);
  }

  @Get('employer-summary')
  getEmployerSummary(@CurrentUser() user: UserSession) {
    return this.dashboardService.getEmployerSummary(user.user.id);
  }
}
