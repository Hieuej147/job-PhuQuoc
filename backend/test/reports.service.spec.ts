import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReportsService } from '../src/modules/reports/reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      job: { findUnique: vi.fn() },
      company: { findUnique: vi.fn() },
      blogPost: { findUnique: vi.fn() },
      jobReport: { findFirst: vi.fn(), create: vi.fn() },
      companyReport: { findFirst: vi.fn(), create: vi.fn() },
      blogReport: { findFirst: vi.fn(), create: vi.fn() },
    };
    service = new ReportsService(prisma);
  });

  it('creates a pending job report without changing the job status', async () => {
    prisma.job.findUnique.mockResolvedValue({ id: 'job-1', status: 'ACTIVE' });
    prisma.jobReport.findFirst.mockResolvedValue(null);
    prisma.jobReport.create.mockResolvedValue({ id: 'report-1', status: 'PENDING' });

    await expect(service.reportJob('job-1', { reason: 'SPAM' as any }, 'user-1'))
      .resolves.toEqual({ id: 'report-1', status: 'PENDING' });

    expect(prisma.jobReport.create).toHaveBeenCalled();
    expect(prisma.job.update).toBeUndefined();
  });

  it('rejects a duplicate active job report', async () => {
    prisma.job.findUnique.mockResolvedValue({ id: 'job-1' });
    prisma.jobReport.findFirst.mockResolvedValue({ id: 'report-1', status: 'REVIEWING' });

    await expect(service.reportJob('job-1', { reason: 'SPAM' as any }, 'user-1'))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('allows a report after the previous report was rejected', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company-1' });
    prisma.companyReport.findFirst.mockResolvedValue(null);
    prisma.companyReport.create.mockResolvedValue({ id: 'report-1', status: 'PENDING' });

    await expect(service.reportCompany('company-1', { reason: 'FRAUD' as any }, 'user-1'))
      .resolves.toMatchObject({ status: 'PENDING' });
  });

  it('throws when the blog does not exist', async () => {
    prisma.blogPost.findUnique.mockResolvedValue(null);

    await expect(service.reportBlog('missing', { reason: 'OTHER' as any }, 'user-1'))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
