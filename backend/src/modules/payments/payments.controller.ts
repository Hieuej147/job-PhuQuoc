import { Controller, Get, Post, Body, Req, Headers, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import type { Request } from 'express';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({
    summary: 'Tạo checkout session',
    description: 'Employer chọn gói + tạo Stripe checkout. FE redirect user đến URL trả về.',
  })
  @ApiResponse({ status: 201, description: '{ url: "https://checkout.stripe.com/...", gateway: "stripe" }' })
  @ApiResponse({ status: 400, description: 'Job đã active hoặc đã có payment pending' })
  @ApiResponse({ status: 403, description: 'Không phải EMPLOYER hoặc không phải owner' })
  @ApiResponse({ status: 404, description: 'Job hoặc package không tồn tại' })
  createCheckout(
    @CurrentUser() user: UserSession,
    @Body() body: CreateCheckoutDto,
  ) {
    return this.paymentsService.createCheckout(
      user.user.id,
      body.jobId,
      body.packageId,
    );
  }

  @Post('webhook')
  @Public()
  @ApiOperation({
    summary: 'Stripe webhook',
    description: 'Stripe gọi endpoint này khi thanh toán thành công. Không gọi trực tiếp.',
  })
  @ApiResponse({ status: 200, description: '{ received: true }' })
  async handleWebhook(
    @Req() req: Request,
    @Headers() headers: Record<string, string>,
  ) {
    const payload = req.body as Buffer;
    return this.paymentsService.handleWebhook(payload, headers);
  }

  @Post('mock-complete')
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({
    summary: 'Mock thanh toán (test)',
    description: 'Chỉ khả dụng trong môi trường development. Không hoạt động ở production.',
  })
  @ApiResponse({ status: 200, description: '{ message: "Payment completed", deadline: "..." }' })
  @ApiResponse({ status: 403, description: 'Không khả dụng ở production' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy payment pending' })
  async mockComplete(
    @Body() body: { jobId?: string; sessionId?: string },
  ) {
    if (process.env.NODE_ENV === 'production') {
      const { ForbiddenException } = await import('@nestjs/common');
      throw new ForbiddenException('Mock payment is not available in production');
    }
    return this.paymentsService.mockCompletePayment(body.jobId, body.sessionId);
  }

  @Get('my')
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Lịch sử thanh toán', description: 'Employer xem lịch sử thanh toán của mình.' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số item/trang' })
  @ApiResponse({ status: 200, description: 'Danh sách payments phân trang' })
  findMyPayments(
    @CurrentUser() user: UserSession,
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.paymentsService.findByUser(user.user.id, query);
  }

  @Get(':id')
  @Roles('EMPLOYER', 'ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Chi tiết payment' })
  @ApiParam({ name: 'id', description: 'ID của payment' })
  @ApiResponse({ status: 200, description: 'Chi tiết payment' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }
}
