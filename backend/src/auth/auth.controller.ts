import { Controller, Get, Body, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SelectRoleDto } from './dto/select-role.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { CompleteEmailRegistrationDto } from './dto/complete-email-registration.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Auth')
@ApiBearerAuth('better-auth.session_token')
@Controller('auth')
export class CustomAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiOperation({ summary: 'Profile hiện tại', description: 'Lấy thông tin profile của user đang đăng nhập.' })
  @ApiResponse({ status: 200, description: 'Thông tin user' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiOkResponse({
    schema: {
      example: {
        user: {
          id: 'user_123',
          name: 'Nguyen Van A',
          email: 'candidate@example.com',
          role: 'CANDIDATE',
          phone: '0909123456',
          image: 'https://cdn.example.com/avatar.png',
          isActive: true,
          isLocked: false,
          createdAt: '2026-06-17T12:00:00.000Z',
          updatedAt: '2026-06-17T12:00:00.000Z',
        },
      },
    },
  })
  async getProfile(@CurrentUser() user: UserSession) {
    const profile = await this.authService.getProfile(user.user.id);
    return { user: profile };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật profile', description: 'Cập nhật tên, số điện thoại, ảnh đại diện.' })
  @ApiBody({
    schema: {
      example: {
        name: 'Nguyen Van A',
        phone: '0909123456',
        image: 'https://cdn.example.com/avatar.png',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiOkResponse({
    schema: {
      example: {
        user: {
          id: 'user_123',
          name: 'Nguyen Van A',
          email: 'candidate@example.com',
          role: 'CANDIDATE',
          phone: '0909123456',
          image: 'https://cdn.example.com/avatar.png',
          isActive: true,
          isLocked: false,
          createdAt: '2026-06-17T12:00:00.000Z',
          updatedAt: '2026-06-17T12:05:00.000Z',
        },
      },
    },
  })
  async updateProfile(
    @CurrentUser() user: UserSession,
    @Body() body: UpdateProfileDto,
  ) {
    const updated = await this.authService.updateProfile(user.user.id, body);
    return { user: updated };
  }

  @Patch('select-role')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Chọn role', description: 'Chỉ dùng khi user chưa có role. Không cho phép đổi role sau khi đã chọn.' })
  @ApiBody({
    schema: {
      example: { role: 'EMPLOYER' },
    },
  })
  @ApiResponse({ status: 200, description: 'Chọn role thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 409, description: 'Role đã được chọn' })
  @ApiOkResponse({
    schema: {
      example: {
        user: {
          id: 'user_123',
          name: 'Nguyen Van A',
          email: 'candidate@example.com',
          role: 'EMPLOYER',
          phone: '0909123456',
          image: null,
          isActive: true,
          isLocked: false,
          createdAt: '2026-06-17T12:00:00.000Z',
          updatedAt: '2026-06-17T12:05:00.000Z',
        },
      },
    },
  })
  async selectRole(
    @CurrentUser() user: UserSession,
    @Body() body: SelectRoleDto,
  ) {
    const updated = await this.authService.selectRole(user.user.id, body.role);
    return { user: updated };
  }

  @Post('register-email')
  @Public()
  @ApiOperation({
    summary: 'Đăng ký email/password',
    description: 'Tự phân luồng: user mới verify email, OAuth user cũ thì link password bằng OTP.',
  })
  @ApiBody({
    schema: {
      example: {
        name: 'Nguyen Van A',
        email: 'candidate@example.com',
        password: 'Secret1234',
        role: 'CANDIDATE',
        phone: '0909123456',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Đăng ký hoặc gửi OTP thành công' })
  @ApiResponse({ status: 409, description: 'Email đã có role khác hoặc đã có mật khẩu' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Đã gửi OTP xác thực email',
        email: 'candidate@example.com',
        status: 'PENDING_OTP',
      },
    },
  })
  async registerEmail(@Body() body: RegisterEmailDto) {
    return this.authService.registerEmail(body);
  }

  @Post('complete-email-registration')
  @Public()
  @ApiOperation({
    summary: 'Hoàn tất đăng ký email',
    description: 'Xác nhận OTP và hoàn tất tài khoản email/password hoặc liên kết credential với user OAuth hiện có.',
  })
  @ApiBody({
    schema: {
      example: {
        email: 'candidate@example.com',
        otp: '123456',
        password: 'Secret1234',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Hoàn tất đăng ký thành công' })
  @ApiResponse({ status: 400, description: 'OTP không hợp lệ' })
  @ApiCreatedResponse({
    schema: {
      example: {
        message: 'Tài khoản đã được kích hoạt',
        email: 'candidate@example.com',
        status: 'VERIFIED',
      },
    },
  })
  async completeEmailRegistration(@Body() body: CompleteEmailRegistrationDto) {
    return this.authService.completeEmailRegistration(body);
  }

  @Post('request-password-reset')
  @Public()
  @ApiOperation({
    summary: 'Yêu cầu quên mật khẩu',
    description: 'Tự phân luồng: email chưa verify -> gửi OTP verify email; có credential -> gửi OTP reset password; OAuth-only -> báo dùng Google.',
  })
  @ApiBody({
    schema: {
      example: {
        email: 'candidate@example.com',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Trả về trạng thái xử lý quên mật khẩu' })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'RESET_PASSWORD_OTP_SENT',
        message: 'Đã gửi OTP đặt lại mật khẩu',
      },
    },
  })
  async requestPasswordReset(@Body() body: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(body);
  }
}
