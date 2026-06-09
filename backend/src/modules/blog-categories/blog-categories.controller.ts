import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { BlogCategoriesService } from './blog-categories.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CreateBlogCategoryDto, UpdateBlogCategoryDto } from './dto/blog-category.dto';

@ApiTags('Blog Categories')
@Controller('blog-categories')
export class BlogCategoriesController {
  constructor(private readonly blogCategoriesService: BlogCategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Danh mục blog', description: 'Lấy tất cả danh mục blog.' })
  @ApiResponse({ status: 200, description: 'Danh sách blog categories' })
  findAll() {
    return this.blogCategoriesService.findAll();
  }

  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Tạo danh mục blog', description: 'ADMIN tạo danh mục blog mới.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  create(@Body() body: CreateBlogCategoryDto) {
    return this.blogCategoriesService.create(body);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Sửa danh mục blog' })
  @ApiParam({ name: 'id', description: 'ID của blog category' })
  @ApiResponse({ status: 200, description: 'Sửa thành công' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  update(@Param('id') id: string, @Body() body: UpdateBlogCategoryDto) {
    return this.blogCategoriesService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Xóa danh mục blog' })
  @ApiParam({ name: 'id', description: 'ID của blog category' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  remove(@Param('id') id: string) {
    return this.blogCategoriesService.remove(id);
  }
}
