import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateCompanyDto, UpdateCompanyDto, CompanyQueryDto } from './dto/company.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Danh sách công ty', description: 'Lấy danh sách công ty công khai.' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm theo tên công ty' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số item/trang' })
  @ApiResponse({ status: 200, description: 'Danh sách companies phân trang' })
  findAll(@Query() query: CompanyQueryDto) {
    return this.companiesService.findAll(query);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Chi tiết công ty theo slug' })
  @ApiParam({ name: 'slug', description: 'Slug của công ty', example: 'phu-quoc-resort-spa' })
  @ApiResponse({ status: 200, description: 'Chi tiết công ty + danh sách jobs ACTIVE' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công ty' })
  findBySlug(@Param('slug') slug: string) {
    return this.companiesService.findBySlug(slug);
  }

  @Get('my')
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Công ty của tôi', description: 'Employer xem công ty của mình.' })
  @ApiResponse({ status: 200, description: 'Chi tiết công ty' })
  @ApiResponse({ status: 403, description: 'Không phải EMPLOYER' })
  @ApiResponse({ status: 404, description: 'Chưa có công ty' })
  findMyCompany(@CurrentUser() user: UserSession) {
    return this.companiesService.findByOwnerId(user.user.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết công ty theo ID' })
  @ApiParam({ name: 'id', description: 'ID của công ty' })
  @ApiResponse({ status: 200, description: 'Chi tiết công ty' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công ty' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }

  @Post()
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Tạo công ty', description: 'Employer tạo công ty mới. Công ty active ngay, không cần duyệt.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không phải EMPLOYER' })
  create(@CurrentUser() user: UserSession, @Body() body: CreateCompanyDto) {
    return this.companiesService.create(user.user.id, body);
  }

  @Patch(':id')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Cập nhật công ty', description: 'Chỉ owner mới được sửa.' })
  @ApiParam({ name: 'id', description: 'ID của công ty' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không phải owner' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công ty' })
  update(@Param('id') id: string, @CurrentUser() user: UserSession, @Body() body: UpdateCompanyDto) {
    return this.companiesService.update(id, user.user.id, body);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Xóa công ty', description: 'ADMIN xóa công ty vi phạm.' })
  @ApiParam({ name: 'id', description: 'ID của công ty' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công ty' })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
