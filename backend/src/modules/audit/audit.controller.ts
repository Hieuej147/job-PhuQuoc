import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Audit')
@Controller('audit')
@Roles('ADMIN')
@ApiBearerAuth('better-auth.session_token')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Nhật ký hệ thống', description: 'ADMIN xem audit logs với filter.' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter theo action (vd: user.registered)' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Filter theo entity type (vd: User, Job)' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter theo entity ID' })
  @ApiQuery({ name: 'actorId', required: false, description: 'Filter theo actor ID' })
  @ApiQuery({ name: 'from', required: false, description: 'Từ ngày (ISO)' })
  @ApiQuery({ name: 'to', required: false, description: 'Đến ngày (ISO)' })
  @ApiResponse({ status: 200, description: 'Danh sách audit logs phân trang' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  findAll(@Query() query: QueryAuditDto) {
    return this.auditService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết audit log' })
  @ApiParam({ name: 'id', description: 'ID của audit log' })
  @ApiResponse({ status: 200, description: 'Chi tiết audit log' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.auditService.findById(id);
  }
}
