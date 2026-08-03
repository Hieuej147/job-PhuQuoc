import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Roles('CANDIDATE', 'EMPLOYER', 'ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('job/:id')
  @ApiOperation({ summary: 'Báo cáo việc làm' })
  @HttpCode(HttpStatus.CREATED)
  reportJob(
    @Param('id') jobId: string,
    @Body() body: CreateReportDto,
    @CurrentUser() user: UserSession,
  ) {
    return this.reportsService.reportJob(jobId, body, user.user.id);
  }

  @Post('company/:id')
  @ApiOperation({ summary: 'Báo cáo công ty' })
  @HttpCode(HttpStatus.CREATED)
  reportCompany(
    @Param('id') companyId: string,
    @Body() body: CreateReportDto,
    @CurrentUser() user: UserSession,
  ) {
    return this.reportsService.reportCompany(companyId, body, user.user.id);
  }

  @Post('blog/:id')
  @ApiOperation({ summary: 'Báo cáo bài viết' })
  @HttpCode(HttpStatus.CREATED)
  reportBlog(
    @Param('id') blogId: string,
    @Body() body: CreateReportDto,
    @CurrentUser() user: UserSession,
  ) {
    return this.reportsService.reportBlog(blogId, body, user.user.id);
  }
}
