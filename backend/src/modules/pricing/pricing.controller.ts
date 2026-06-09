import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Gói đăng tin', description: 'Lấy danh sách gói đăng tin.' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter gói active (true/false)' })
  @ApiResponse({ status: 200, description: 'Danh sách pricing packages' })
  findAll(@Query('active') active?: string) {
    return this.pricingService.findAll(active === 'true');
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết gói' })
  @ApiParam({ name: 'id', description: 'ID của package' })
  @ApiResponse({ status: 200, description: 'Chi tiết package' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.pricingService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Tạo gói mới', description: 'ADMIN tạo gói đăng tin mới.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  create(@Body() body: CreatePricingDto) {
    return this.pricingService.create(body);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Sửa gói' })
  @ApiParam({ name: 'id', description: 'ID của package' })
  @ApiResponse({ status: 200, description: 'Sửa thành công' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  update(@Param('id') id: string, @Body() body: UpdatePricingDto) {
    return this.pricingService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Xóa gói', description: 'Xóa gói (không xóa được nếu có payment liên quan).' })
  @ApiParam({ name: 'id', description: 'ID của package' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 403, description: 'Không phải ADMIN' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hoặc có payment liên quan' })
  remove(@Param('id') id: string) {
    return this.pricingService.remove(id);
  }
}
