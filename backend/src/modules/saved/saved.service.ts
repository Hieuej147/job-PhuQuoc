import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SavedQueryDto } from './dto/saved-query.dto';

@Injectable()
export class SavedService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async saveJob(userId: string, jobId: string) {
    const existing = await this.prisma.savedJob.findUnique({ where: { userId_jobId: { userId, jobId } } });
    if (existing) {
      await this.prisma.savedJob.delete({ where: { id: existing.id } });
      return { saved: false };
    }

    await this.prisma.savedJob.create({ data: { userId, jobId } });

    return { saved: true };
  }

  async getSavedJobs(userId: string, query: SavedQueryDto) {
    const page = query.page || 1;
    const limit = Math.min(100, query.limit || 10);
    const [items, total] = await Promise.all([
      this.prisma.savedJob.findMany({
        where: { userId }, skip: (page - 1) * limit, take: limit,
        include: { job: { include: { company: { select: { name: true, logo: true } }, category: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.savedJob.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async removeSavedJob(userId: string, savedJobId: string) {
    const saved = await this.prisma.savedJob.findUnique({ where: { id: savedJobId } });
    if (!saved || saved.userId !== userId) {
      throw new NotFoundException('Saved job not found');
    }

    await this.prisma.savedJob.delete({ where: { id: savedJobId } });
    return { saved: false };
  }

  async saveCompany(userId: string, companyId: string) {
    const existing = await this.prisma.savedCompany.findUnique({ where: { userId_companyId: { userId, companyId } } });
    if (existing) { await this.prisma.savedCompany.delete({ where: { id: existing.id } }); return { saved: false }; }
    await this.prisma.savedCompany.create({ data: { userId, companyId } });
    return { saved: true };
  }

  async getSavedCompanies(userId: string, query: SavedQueryDto) {
    const page = query.page || 1;
    const limit = Math.min(100, query.limit || 10);
    const [items, total] = await Promise.all([
      this.prisma.savedCompany.findMany({
        where: { userId }, skip: (page - 1) * limit, take: limit,
        include: { company: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.savedCompany.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async removeSavedCompany(userId: string, savedCompanyId: string) {
    const saved = await this.prisma.savedCompany.findUnique({ where: { id: savedCompanyId } });
    if (!saved || saved.userId !== userId) {
      throw new NotFoundException('Saved company not found');
    }

    await this.prisma.savedCompany.delete({ where: { id: savedCompanyId } });
    return { saved: false };
  }
}
