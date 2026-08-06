/**
 * @file        reports.service.ts
 * @description Xử lý báo cáo tin tuyển dụng, công ty, bài viết
 *
 * @module      backend/src/modules/reports
 * @author      HuynhhThanh
 * @created     2026-06-01
 * @modified    2026-08-03 v1.0.0 — Lưu report PENDING để Admin quyết định xử lý
 *
 * @modify 2026-08-02 20:51
 *  - Làm gì?       Lưu báo cáo ở trạng thái PENDING
 *  - Tại sao?      Để Admin đánh giá trước khi thay đổi nội dung hoặc trạng thái
 *  - Lỗi gì?       Không tự động ẩn Job từ một report đơn lẻ
 *  - Thiếu gì?     (Không)
 *  - Sửa thế nào?  Tách việc ghi report khỏi quyết định moderation của adminjob
 *  - Đã khắc phục? ✅ OK
 */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async reportJob(jobId: string, dto: CreateReportDto, reporterId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Không tìm thấy công việc này.');

    const existing = await this.prisma.jobReport.findFirst({
      where: {
        jobId,
        reporterId,
        status: { in: [ReportStatus.PENDING, ReportStatus.REVIEWING, ReportStatus.RESOLVED] },
      },
    });

    if (existing) {
      throw new ConflictException('Bạn đã báo cáo công việc này rồi.');
    }

    return this.prisma.jobReport.create({
      data: {
        jobId,
        reporterId,
        reason: dto.reason,
        description: dto.description,
        evidence: dto.evidence || {},
      },
    });
  }

  async reportCompany(companyId: string, dto: CreateReportDto, reporterId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Không tìm thấy công ty này.');

    const existing = await this.prisma.companyReport.findFirst({
      where: {
        companyId,
        reporterId,
        status: { in: [ReportStatus.PENDING, ReportStatus.REVIEWING, ReportStatus.RESOLVED] },
      },
    });

    if (existing) {
      throw new ConflictException('Bạn đã báo cáo công ty này rồi.');
    }

    return this.prisma.companyReport.create({
      data: {
        companyId,
        reporterId,
        reason: dto.reason,
        description: dto.description,
        evidence: dto.evidence || {},
      },
    });
  }

  async reportBlog(blogId: string, dto: CreateReportDto, reporterId: string) {
    const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
    if (!blog) throw new NotFoundException('Không tìm thấy bài viết này.');

    const existing = await this.prisma.blogReport.findFirst({
      where: {
        blogId,
        reporterId,
        status: { in: [ReportStatus.PENDING, ReportStatus.REVIEWING, ReportStatus.RESOLVED] },
      },
    });

    if (existing) {
      throw new ConflictException('Bạn đã báo cáo bài viết này rồi.');
    }

    return this.prisma.blogReport.create({
      data: {
        blogId,
        reporterId,
        reason: dto.reason,
        description: dto.description,
        evidence: dto.evidence || {},
      },
    });
  }
}
