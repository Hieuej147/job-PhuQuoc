import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth('better-auth.session_token')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Thông báo', description: 'Xem danh sách thông báo.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'isRead', required: false, description: 'Filter: true/false' })
  @ApiResponse({ status: 200, description: 'Danh sách notifications phân trang' })
  findAll(@CurrentUser() user: UserSession, @Query() query: NotificationQueryDto) {
    return this.notificationsService.findByUser(user.user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Số thông báo chưa đọc' })
  @ApiResponse({ status: 200, description: '{ count: number }' })
  getUnreadCount(@CurrentUser() user: UserSession) {
    return this.notificationsService.getUnreadCount(user.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu đã đọc' })
  @ApiParam({ name: 'id', description: 'ID của notification' })
  @ApiResponse({ status: 200, description: 'Đánh dấu thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy notification của bạn' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: UserSession) {
    return this.notificationsService.markAsRead(id, user.user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đọc tất cả thông báo' })
  @ApiResponse({ status: 200, description: '{ message: "All notifications marked as read" }' })
  markAllAsRead(@CurrentUser() user: UserSession) {
    return this.notificationsService.markAllAsRead(user.user.id);
  }
}
