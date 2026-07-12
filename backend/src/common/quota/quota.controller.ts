import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsEnum, IsString } from 'class-validator';
import { CandidateQuotaPlan, EmployerQuotaPlan } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { QuotaService } from './quota.service';
import type { QuotaUpgradePlan } from './quota.types';

class UpgradeQuotaDto {
  @IsEnum({ ...CandidateQuotaPlan, ...EmployerQuotaPlan })
  plan: QuotaUpgradePlan;
}

class CreateQuotaCheckoutDto {
  @IsString()
  packageId: string;
}

class MockCompleteQuotaDto {
  @IsString()
  sessionId: string;
}

@ApiTags('Quota')
@Controller('quota')
export class QuotaController {
  constructor(private readonly quotaService: QuotaService) {}

  @Get('me')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Xem quota và gói hiện tại của user' })
  getMine(@CurrentUser() user: UserSession) {
    return this.quotaService.getUserQuotaSnapshot(user.user.id);
  }

  @Get('packages')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Danh sách package nâng quota đang mở' })
  getPackages() {
    return this.quotaService.getPackages();
  }

  @Post('checkout')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Tạo checkout mock để nâng gói quota' })
  checkout(@CurrentUser() user: UserSession, @Body() body: CreateQuotaCheckoutDto) {
    return this.quotaService.createCheckout(user.user.id, body.packageId);
  }

  @Get('checkout/:sessionId')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Chi tiết checkout quota mock' })
  getCheckout(@CurrentUser() user: UserSession, @Param('sessionId') sessionId: string) {
    return this.quotaService.getCheckoutSession(sessionId, user.user.id);
  }

  @Post('mock-complete')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Hoàn tất thanh toán quota mock' })
  mockComplete(@CurrentUser() user: UserSession, @Body() body: MockCompleteQuotaDto) {
    return this.quotaService.mockComplete(body.sessionId, user.user.id);
  }

  @Post('upgrade')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Nâng gói quota demo/mock legacy' })
  async upgrade(@CurrentUser() user: UserSession, @Body() body: UpgradeQuotaDto) {
    const plan = await this.quotaService.upgradeUserPlan(user.user.id, body.plan);
    return {
      message: 'Quota plan upgraded in demo mode',
      plan,
    };
  }
}
