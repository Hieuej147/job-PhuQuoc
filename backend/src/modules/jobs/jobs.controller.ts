/**
 * TÊN FILE: Quản lý Tin Tuyển Dụng (Jobs Controller)
 * MÔ TẢ: Tiếp nhận các request từ Frontend liên quan đến Job (Đăng tin, sửa tin, tìm kiếm, lấy danh sách tin của Employer).
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - Giao tiếp với `JobsService` để truy vấn thực tế vào bảng `Job` trong PostgreSQL (qua Prisma).
 * - FE gọi `GET /api/v1/jobs/my` -> BE xác thực Employer -> Trả về danh sách việc làm thực tế từ DB.
 */
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateJobDto, UpdateJobDto, JobQueryDto, MyJobsQueryDto, VectorSearchDto } from './dto/job.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Tìm kiếm việc làm', description: 'Tìm kiếm và lọc việc làm. Mặc định chỉ trả về job ACTIVE.' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm theo tiêu đề hoặc mô tả' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'ID danh mục nghề' })
  @ApiQuery({ name: 'type', required: false, description: 'Loại hình: FULL_TIME, PART_TIME, REMOTE, CONTRACT, INTERNSHIP, FREELANCE' })
  @ApiQuery({ name: 'experience', required: false, description: 'Kinh nghiệm: NO_EXPERIENCE, UNDER_1_YEAR, ONE_TO_THREE_YEARS, THREE_TO_FIVE_YEARS, OVER_FIVE_YEARS' })
  @ApiQuery({ name: 'level', required: false, description: 'Cấp bậc: INTERN, FRESHER, JUNIOR, MID, SENIOR, LEAD, MANAGER, DIRECTOR' })
  @ApiQuery({ name: 'status', required: false, description: 'Trạng thái: DRAFT, PENDING, ACTIVE, CLOSED' })
  @ApiQuery({ name: 'salaryMin', required: false, description: 'Lương tối thiểu (VND)' })
  @ApiQuery({ name: 'salaryMax', required: false, description: 'Lương tối đa (VND)' })
  @ApiQuery({ name: 'wardId', required: false, description: 'ID phường/xã' })
  @ApiQuery({ name: 'companyId', required: false, description: 'ID công ty' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số item/trang (default: 10)' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sắp xếp: salary_asc (lương thấp nhất), expiring_soon (sắp hết hạn)' })
  @ApiResponse({ status: 200, description: 'Danh sách jobs phân trang' })
  findAll(@Query() query: JobQueryDto) {
    return this.jobsService.findAll(query);
  }

  @Get('my')
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Job của tôi', description: 'Employer xem tất cả job của mình (tất cả status).' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số item/trang' })
  @ApiQuery({ name: 'status', required: false, description: 'Lọc theo status: DRAFT, PENDING, ACTIVE, CLOSED' })
  @ApiResponse({ status: 200, description: 'Danh sách jobs phân trang' })
  @ApiResponse({ status: 403, description: 'Không phải EMPLOYER' })
  findMyJobs(@CurrentUser() user: UserSession, @Query() query: MyJobsQueryDto) {
    return this.jobsService.findByOwner(user.user.id, query);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Chi tiết job theo slug', description: 'Lấy chi tiết job bằng slug (SEO-friendly URL).' })
  @ApiParam({ name: 'slug', description: 'Slug của job', example: 'le-tan-khach-san' })
  @ApiResponse({ status: 200, description: 'Chi tiết job' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy job' })
  findBySlug(@Param('slug') slug: string) {
    return this.jobsService.findBySlug(slug);
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Lấy số liệu đếm của các bộ lọc' })
  @ApiResponse({ status: 200, description: 'Số liệu đếm theo loại hình, kinh nghiệm, cấp bậc, mức lương' })
  getFilterStats() {
    return this.jobsService.getFilterStats();
  }

  @Post('search-vector')
  @Public()
  @ApiOperation({ summary: 'Tìm kiếm job bằng AI vector', description: 'Agent Python gọi API này với vector nhúng để tìm kiếm semantic job.' })
  @ApiResponse({ status: 200, description: 'Danh sách top jobs phù hợp' })
  vectorSearch(@Body() body: VectorSearchDto) {
    return this.jobsService.vectorSearch(body.embedding, body.limit || 10);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết job theo ID' })
  @ApiParam({ name: 'id', description: 'ID của job' })
  @ApiResponse({ status: 200, description: 'Chi tiết job' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy job' })
  findOne(@Param('id') id: string) {
    return this.jobsService.findById(id);
  }

  @Post()
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Tạo job mới', description: 'Employer tạo job mới. Job sẽ ở trạng thái DRAFT.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công, status: DRAFT' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không phải EMPLOYER' })
  @ApiResponse({ status: 404, description: 'Employer chưa có công ty' })
  create(@CurrentUser() user: UserSession, @Body() body: CreateJobDto) {
    return this.jobsService.create(user.user.id, body);
  }

  @Patch(':id')
  @ApiBearerAuth('better-auth.session_token')
  // Reserved for future draft-edit flow only. Current FE does not call this endpoint.
  // Do not use it to edit paid/ACTIVE jobs because payment tracking, public listing,
  // Inngest expiry scheduling, and applicant expectations depend on the activated job data.
  @ApiOperation({ summary: 'Cập nhật job', description: 'Dự phòng cho flow sửa DRAFT trước thanh toán. Không dùng để sửa job đã ACTIVE.' })
  @ApiParam({ name: 'id', description: 'ID của job' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không phải owner' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy job' })
  update(@Param('id') id: string, @CurrentUser() user: UserSession, @Body() body: UpdateJobDto) {
    return this.jobsService.update(id, user.user.id, body);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Xóa job', description: 'ADMIN xóa job vi phạm nội dung.' })
  @ApiParam({ name: 'id', description: 'ID của job' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy job' })
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
