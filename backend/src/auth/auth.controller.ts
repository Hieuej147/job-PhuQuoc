import { Controller, Get, Body, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomAuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Auth')
@ApiBearerAuth('better-auth.session_token')
@Controller('auth')
export class CustomAuthController {
  constructor(private readonly authService: CustomAuthService) {}

  @Get('me')
  @ApiOperation({ summary: 'Profile hiện tại', description: 'Lấy thông tin profile của user đang đăng nhập.' })
  @ApiResponse({ status: 200, description: 'Thông tin user' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getProfile(@CurrentUser() user: UserSession) {
    const profile = await this.authService.getProfile(user.user.id);
    return { user: profile };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật profile', description: 'Cập nhật tên, số điện thoại, vai trò.' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async updateProfile(
    @CurrentUser() user: UserSession,
    @Body() body: UpdateProfileDto,
  ) {
    const updated = await this.authService.updateProfile(user.user.id, body);
    return { user: updated };
  }

  @Get('admin-only')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin only', description: 'Endpoint test quyền admin.' })
  @ApiResponse({ status: 200, description: 'Admin access granted' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  async adminEndpoint() {
    return { message: 'Admin access granted' };
  }
}
