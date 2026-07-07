/**
 * TÊN FILE: Quản lý Đơn Ứng Tuyển (Applications Controller)
 * MÔ TẢ: Xử lý logic nộp CV của Candidate và quản lý trạng thái hồ sơ của Employer.
 * TƯƠNG TÁC DỮ LIỆU (FE-BE-DB):
 * - Tương tác trực tiếp với bảng `Application` qua Prisma.
 * - FE gọi `GET /api/v1/applications/employer` -> Trả về dữ liệu thật từ DB cho Nhà tuyển dụng.
 * - FE gọi `PATCH /api/v1/applications/:id/status` -> Lưu trạng thái mới (Duyệt/Từ chối) thẳng vào Database.
 */
import { BadRequestException, Controller, Get, Post, Patch, Delete, Param, Query, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ApplicationsService } from './applications.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dto/application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Applications')
@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @Roles('CANDIDATE')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Ứng tuyển việc làm', description: 'Candidate nộp CV cho job. Mỗi user chỉ được nộp 1 lần/job.' })
  @ApiResponse({ status: 201, description: 'Nộp CV thành công, status: PENDING' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không phải CANDIDATE' })
  @ApiResponse({ status: 409, description: 'Đã nộp CV cho job này rồi' })
  apply(@CurrentUser() user: UserSession, @Body() body: CreateApplicationDto) {
    return this.applicationsService.apply(user.user.id, body);
  }

  @Get('my')
  @Roles('CANDIDATE')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Đơn ứng tuyển của tôi', description: 'Candidate xem danh sách đơn đã nộp.' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số item/trang' })
  @ApiResponse({ status: 200, description: 'Danh sách applications phân trang' })
  @ApiResponse({ status: 403, description: 'Không phải CANDIDATE' })
  findMyApplications(@CurrentUser() user: UserSession, @Query() query: ApplicationQueryDto) {
    return this.applicationsService.findByUser(user.user.id, query);
  }

  @Get('check/:jobId')
  @Roles('CANDIDATE')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Kiểm tra đã ứng tuyển job chưa', description: 'Candidate kiểm tra trạng thái ứng tuyển cho một job.' })
  @ApiParam({ name: 'jobId', description: 'ID của job' })
  @ApiResponse({ status: 200, description: '{ applied, applicationId, status }' })
  @ApiResponse({ status: 403, description: 'Không phải CANDIDATE' })
  checkApplied(@Param('jobId') jobId: string, @CurrentUser() user: UserSession) {
    return this.applicationsService.checkApplied(user.user.id, jobId);
  }

  @Get('employer')
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Tất cả đơn ứng tuyển', description: 'Employer xem tất cả đơn ứng tuyển cho các job của mình.' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số item/trang' })
  @ApiResponse({ status: 200, description: 'Danh sách applications phân trang' })
  @ApiResponse({ status: 403, description: 'Không phải EMPLOYER' })
  findEmployerApplications(@CurrentUser() user: UserSession, @Query() query: ApplicationQueryDto) {
    return this.applicationsService.findByEmployer(user.user.id, query);
  }

  @Get('job/:jobId')
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Xem ứng viên theo job', description: 'Employer xem danh sách ứng viên đã nộp CV cho job.' })
  @ApiParam({ name: 'jobId', description: 'ID của job' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số item/trang' })
  @ApiResponse({ status: 200, description: 'Danh sách applications phân trang' })
  @ApiResponse({ status: 403, description: 'Không phải owner của công ty' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy job' })
  findByJob(@Param('jobId') jobId: string, @CurrentUser() user: UserSession, @Query() query: ApplicationQueryDto) {
    return this.applicationsService.findByJob(jobId, user.user.id, query);
  }

  @Get(':id/resume')
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Xem dữ liệu CV ứng viên', description: 'Employer lấy CV theo application ID. Backend kiểm tra application thuộc job của công ty employer hiện tại.' })
  @ApiParam({ name: 'id', description: 'ID của application' })
  @ApiResponse({ status: 200, description: 'Dữ liệu CV đã lưu hoặc URL file PDF upload' })
  @ApiResponse({ status: 403, description: 'Không phải owner của công ty' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy application hoặc CV' })
  getResume(@Param('id') id: string, @CurrentUser() user: UserSession) {
    return this.applicationsService.getResumeForEmployer(id, user.user.id);
  }

  @Get(':id/resume-file')
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Xem file CV PDF upload', description: 'Employer stream file PDF ứng viên đã upload theo application ID. Backend kiểm tra ownership và chỉ proxy URL Cloudinary hợp lệ của hệ thống.' })
  @ApiParam({ name: 'id', description: 'ID của application' })
  @ApiResponse({ status: 200, description: 'PDF inline' })
  @ApiResponse({ status: 403, description: 'Không phải owner của công ty' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy application hoặc CV upload' })
  async getResumeFile(@Param('id') id: string, @CurrentUser() user: UserSession, @Res() res: Response) {
    const { url } = await this.applicationsService.getUploadedCvUrlForEmployer(id, user.user.id);
    let fileResponse = await fetch(url);

    if (!fileResponse.ok && url.includes('/image/upload/')) {
      const signedUrl = this.cloudinaryService.createPrivateDownloadUrlFromDeliveryUrl(url);
      fileResponse = await fetch(signedUrl);
    }

    if (!fileResponse.ok) {
      throw new BadRequestException(`Không thể tải file CV từ storage (${fileResponse.status})`);
    }

    const buffer = Buffer.from(await fileResponse.arrayBuffer());
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="cv-${id}.pdf"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'private, max-age=300',
    });
    res.send(buffer);
  }

  @Patch(':id/status')
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Duyệt/từ chối CV', description: 'Employer cập nhật trạng thái đơn ứng tuyển.' })
  @ApiParam({ name: 'id', description: 'ID của application' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không phải owner của công ty' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy application' })
  updateStatus(@Param('id') id: string, @CurrentUser() user: UserSession, @Body() body: UpdateApplicationStatusDto) {
    return this.applicationsService.updateStatus(id, user.user.id, body.status);
  }

  @Patch(':id/bookmark')
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Đánh dấu bookmark', description: 'Employer toggle bookmark cho application.' })
  @ApiParam({ name: 'id', description: 'ID của application' })
  @ApiResponse({ status: 200, description: 'Toggle bookmark thành công' })
  @ApiResponse({ status: 403, description: 'Không phải owner' })
  toggleBookmark(@Param('id') id: string, @CurrentUser() user: UserSession) {
    return this.applicationsService.toggleBookmark(id, user.user.id);
  }

  @Delete(':id')
  @Roles('CANDIDATE')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Rút đơn ứng tuyển', description: 'Candidate rút đơn đã nộp.' })
  @ApiParam({ name: 'id', description: 'ID của application' })
  @ApiResponse({ status: 200, description: 'Rút đơn thành công' })
  @ApiResponse({ status: 403, description: 'Không phải owner' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy application' })
  remove(@Param('id') id: string, @CurrentUser() user: UserSession) {
    return this.applicationsService.remove(id, user.user.id);
  }
}
