import { Controller, Get, Patch, Delete, Param, Query, Body, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UpdateUserDto, UserQueryDto } from './dto/user.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Danh sách users', description: 'ADMIN xem danh sách tất cả users.' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số item/trang' })
  @ApiQuery({ name: 'role', required: false, description: 'Lọc theo role: CANDIDATE, EMPLOYER, ADMIN' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm theo tên hoặc email' })
  @ApiResponse({ status: 200, description: 'Danh sách users phân trang' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Chi tiết user' })
  @ApiParam({ name: 'id', description: 'ID của user' })
  @ApiResponse({ status: 200, description: 'Chi tiết user' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy user' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Cập nhật user', description: 'User cập nhật profile mình, hoặc ADMIN cập nhật bất kỳ ai.' })
  @ApiParam({ name: 'id', description: 'ID của user' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  update(@Param('id') id: string, @Body() body: UpdateUserDto, @CurrentUser() user: UserSession) {
    if (user.user.role !== 'ADMIN' && user.user.id !== id) {
      throw new ForbiddenException('Not authorized to update this user');
    }
    return this.usersService.update(id, body);
  }

  @Patch(':id/toggle-active')
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Bật/tắt active', description: 'ADMIN bật/tắt trạng thái active của user.' })
  @ApiParam({ name: 'id', description: 'ID của user' })
  @ApiResponse({ status: 200, description: 'Toggle thành công' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @Patch(':id/toggle-lock')
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Khóa/mở khóa', description: 'ADMIN khóa/mở khóa tài khoản user.' })
  @ApiParam({ name: 'id', description: 'ID của user' })
  @ApiResponse({ status: 200, description: 'Toggle thành công' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  toggleLock(@Param('id') id: string) {
    return this.usersService.toggleLock(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Xóa user', description: 'ADMIN xóa user.' })
  @ApiParam({ name: 'id', description: 'ID của user' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
