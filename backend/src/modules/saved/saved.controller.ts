import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SavedService } from './saved.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SavedQueryDto } from './dto/saved-query.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Saved')
@Controller('saved')
@ApiBearerAuth('better-auth.session_token')
export class SavedController {
  constructor(private readonly savedService: SavedService) {}

  @Post('jobs/:jobId')
  @Roles('CANDIDATE')
  @ApiOperation({ summary: 'Lưu/bỏ lưu job', description: 'Candidate toggle lưu job. Trả về { saved: true } hoặc { saved: false }.' })
  @ApiParam({ name: 'jobId', description: 'ID của job' })
  @ApiResponse({ status: 200, description: '{ saved: true } hoặc { saved: false }' })
  @ApiResponse({ status: 403, description: 'Không phải CANDIDATE' })
  toggleSaveJob(@Param('jobId') jobId: string, @CurrentUser() user: UserSession) {
    return this.savedService.saveJob(user.user.id, jobId);
  }

  @Get('jobs')
  @Roles('CANDIDATE')
  @ApiOperation({ summary: 'Jobs đã lưu', description: 'Candidate xem danh sách jobs đã lưu.' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số item/trang' })
  @ApiResponse({ status: 200, description: 'Danh sách saved jobs phân trang' })
  getSavedJobs(@CurrentUser() user: UserSession, @Query() query: SavedQueryDto) {
    return this.savedService.getSavedJobs(user.user.id, query);
  }

  @Post('companies/:companyId')
  @Roles('CANDIDATE')
  @ApiOperation({ summary: 'Lưu/bỏ lưu company', description: 'Candidate toggle lưu company.' })
  @ApiParam({ name: 'companyId', description: 'ID của company' })
  @ApiResponse({ status: 200, description: '{ saved: true } hoặc { saved: false }' })
  @ApiResponse({ status: 403, description: 'Không phải CANDIDATE' })
  toggleSaveCompany(@Param('companyId') companyId: string, @CurrentUser() user: UserSession) {
    return this.savedService.saveCompany(user.user.id, companyId);
  }

  @Get('companies')
  @Roles('CANDIDATE')
  @ApiOperation({ summary: 'Companies đã lưu', description: 'Candidate xem danh sách companies đã lưu.' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số item/trang' })
  @ApiResponse({ status: 200, description: 'Danh sách saved companies phân trang' })
  getSavedCompanies(@CurrentUser() user: UserSession, @Query() query: SavedQueryDto) {
    return this.savedService.getSavedCompanies(user.user.id, query);
  }
}
