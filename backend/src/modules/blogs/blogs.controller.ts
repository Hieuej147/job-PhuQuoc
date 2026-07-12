/**
 * @file blogs.controller.ts
 * @description Controller xử lý các API liên quan đến Blog/Cẩm nang.
 * @note [HuynhhThanh] Trao đổi dữ liệu: Trả về danh sách bài viết và chi tiết bài viết (chứa lượt xem thực tế) từ Database (PostgreSQL) cho Frontend (Next.js).
 */
import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateBlogDto, UpdateBlogDto, BlogQueryDto } from './dto/blog.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Danh sách blogs', description: 'Lấy danh sách blog đã publish.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false, description: 'Slug của danh mục' })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Sắp xếp (views, newest, oldest)' })
  @ApiResponse({ status: 200, description: 'Danh sách blogs phân trang' })
  findAll(@Query() query: BlogQueryDto) {
    return this.blogsService.findAll(query);
  }

  @Get('my')
  @Roles('CANDIDATE', 'EMPLOYER', 'ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Danh sách blog của tôi' })
  @ApiResponse({ status: 200, description: 'Danh sách blog của tác giả hiện tại' })
  findMyBlogs(@CurrentUser() user: UserSession, @Query() query: BlogQueryDto) {
    return this.blogsService.findMyBlogs(user.user.id, query);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Chi tiết blog theo slug' })
  @ApiParam({ name: 'slug', description: 'Slug của blog' })
  @ApiResponse({ status: 200, description: 'Chi tiết blog' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findBySlug(@Param('slug') slug: string) {
    return this.blogsService.findBySlug(slug);
  }

  @Post('slug/:slug/view')
  @Public()
  @ApiOperation({ summary: 'Tăng lượt xem blog theo slug' })
  @ApiParam({ name: 'slug', description: 'Slug của blog' })
  @ApiResponse({ status: 200, description: 'Tăng lượt xem thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  incrementView(@Param('slug') slug: string) {
    return this.blogsService.incrementView(slug);
  }

  @Post()
  @Roles('CANDIDATE', 'EMPLOYER', 'ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Tạo blog', description: 'Tạo bài viết mới.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  create(@CurrentUser() user: UserSession, @Body() body: CreateBlogDto) {
    return this.blogsService.create(user.user.id, body);
  }

  @Patch(':id')
  @Roles('CANDIDATE', 'EMPLOYER', 'ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Sửa blog' })
  @ApiParam({ name: 'id', description: 'ID của blog' })
  @ApiResponse({ status: 200, description: 'Sửa thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền chỉnh sửa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: UserSession,
    @Body() body: UpdateBlogDto,
  ) {
    return this.blogsService.update(id, user.user.id, user.user.role as any, body);
  }

  @Delete(':id')
  @Roles('CANDIDATE', 'EMPLOYER', 'ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Xóa blog' })
  @ApiParam({ name: 'id', description: 'ID của blog' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  remove(@Param('id') id: string, @CurrentUser() user: UserSession) {
    return this.blogsService.remove(id, user.user.id, user.user.role as any);
  }
}
