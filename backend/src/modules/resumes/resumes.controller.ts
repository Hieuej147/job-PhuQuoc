import { Controller, Get, Post, Patch, Delete, Param, Body, Res, Header, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ResumesService } from './resumes.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CreateResumeDto, UpdateResumeDto, CreateTemplateDto, UpdateTemplateDto } from './dto/resume.dto';
import { RenderTemplateDto } from './dto/render-template.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Resumes')
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  // ===== Template Endpoints =====

  @Get('templates')
  @Public()
  @ApiOperation({ summary: 'Danh sách templates', description: 'Lấy danh sách templates CV (public + của user nếu đăng nhập).' })
  @ApiQuery({ name: 'public', required: false, description: 'Chỉ lấy public templates' })
  @ApiResponse({ status: 200, description: 'Danh sách templates' })
  async getTemplates(@CurrentUser() user?: UserSession, @Query('public') isPublic?: string) {
    const userId = user?.user?.id;
    const publicOnly = isPublic === 'true';
    const templates = await this.resumesService.getTemplates(userId, publicOnly);
    return templates;
  }

  @Get('templates/:id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết template' })
  @ApiParam({ name: 'id', description: 'ID của template' })
  @ApiResponse({ status: 200, description: 'Chi tiết template' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async getTemplate(@Param('id') id: string) {
    const template = await this.resumesService.getTemplateById(id);
    return { data: template };
  }

  @Post('templates')
  @Roles('CANDIDATE')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Tạo template CV', description: 'Candidate tạo template CV mới.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Template không hợp lệ' })
  async createTemplate(@CurrentUser() user: UserSession, @Body() body: CreateTemplateDto) {
    const template = await this.resumesService.createTemplate(user.user.id, body);
    return { data: template };
  }

  @Patch('templates/:id')
  @Roles('CANDIDATE')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Cập nhật template', description: 'Chỉ owner mới được sửa.' })
  @ApiParam({ name: 'id', description: 'ID của template' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không phải owner' })
  async updateTemplate(@Param('id') id: string, @CurrentUser() user: UserSession, @Body() body: UpdateTemplateDto) {
    const template = await this.resumesService.updateTemplate(id, user.user.id, body);
    return { data: template };
  }

  @Delete('templates/:id')
  @Roles('CANDIDATE')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Xóa template', description: 'Chỉ owner mới được xóa.' })
  @ApiParam({ name: 'id', description: 'ID của template' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 403, description: 'Không phải owner' })
  async removeTemplate(@Param('id') id: string, @CurrentUser() user: UserSession) {
    return this.resumesService.removeTemplate(id, user.user.id);
  }

  // ===== Resume Endpoints =====

  @Get('my')
  @Roles('CANDIDATE')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'CV của tôi', description: 'Candidate xem danh sách CV đã tạo.' })
  @ApiResponse({ status: 200, description: 'Danh sách resumes' })
  async findMy(@CurrentUser() user: UserSession) {
    const resumes = await this.resumesService.findByUser(user.user.id);
    return { data: resumes };
  }

  @Get(':id')
  @Roles('CANDIDATE', 'EMPLOYER', 'ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Chi tiết CV' })
  @ApiParam({ name: 'id', description: 'ID của resume' })
  @ApiResponse({ status: 200, description: 'Chi tiết resume' })
  @ApiResponse({ status: 403, description: 'Không phải owner' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findOne(@Param('id') id: string, @CurrentUser() user: UserSession) {
    const resume = await this.resumesService.findById(id, user.user.id);
    return { data: resume };
  }

  @Get(':id/render')
  @Roles('CANDIDATE', 'EMPLOYER', 'ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Render CV', description: 'Render CV thành HTML hoàn chỉnh.' })
  @ApiParam({ name: 'id', description: 'ID của resume' })
  @ApiQuery({ name: 'mode', required: false, enum: ['view', 'edit'], description: 'Chế độ render' })
  @ApiResponse({ status: 200, description: 'HTML render' })
  @ApiResponse({ status: 403, description: 'Không phải owner' })
  async render(@Param('id') id: string, @CurrentUser() user: UserSession, @Query('mode') mode?: string) {
    const result = await this.resumesService.render(id, user.user.id, (mode as 'view' | 'edit') || 'view');
    return { data: result };
  }

  @Post('render-template')
  @Public()
  @ApiOperation({ summary: 'Render template với data', description: 'Render template với data mẫu để preview.' })
  @ApiResponse({ status: 200, description: 'HTML render' })
  async renderTemplate(@Body() body: RenderTemplateDto) {
    const result = await this.resumesService.renderTemplate(body.templateId, body.data, (body.mode as 'view' | 'edit') || 'view');
    return { data: result };
  }

  @Get(':id/pdf')
  @Roles('CANDIDATE', 'EMPLOYER', 'ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Export CV PDF', description: 'Xuất CV dưới dạng PDF.' })
  @ApiParam({ name: 'id', description: 'ID của resume' })
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 403, description: 'Không phải owner' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async getPdf(@Param('id') id: string, @CurrentUser() user: UserSession, @Res() res: Response) {
    const pdf = await this.resumesService.generatePdf(id, user.user.id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="resume-${id}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.send(pdf);
  }

  @Post()
  @Roles('CANDIDATE')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Tạo CV', description: 'Candidate tạo CV mới.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 403, description: 'Không phải CANDIDATE' })
  async create(@CurrentUser() user: UserSession, @Body() body: CreateResumeDto) {
    const resume = await this.resumesService.create(user.user.id, body as unknown as Record<string, unknown>);
    return { data: resume };
  }

  @Patch(':id')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Cập nhật CV', description: 'Chỉ owner mới được sửa.' })
  @ApiParam({ name: 'id', description: 'ID của resume' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không phải owner' })
  async update(@Param('id') id: string, @CurrentUser() user: UserSession, @Body() body: UpdateResumeDto) {
    const resume = await this.resumesService.update(id, user.user.id, body as unknown as Record<string, unknown>);
    return { data: resume };
  }

  @Delete(':id')
  @Roles('CANDIDATE')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Xóa CV', description: 'Chỉ owner mới được xóa.' })
  @ApiParam({ name: 'id', description: 'ID của resume' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 403, description: 'Không phải owner' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserSession) {
    return this.resumesService.remove(id, user.user.id);
  }
}
