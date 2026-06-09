import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InngestService } from '../../inngest/inngest.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../../common/cache/cache.service';
import { CompanyContractService } from '../shared/contracts/company.contract';
import { Prisma, JobStatus, JobType, ExperienceLevel, JobLevel } from '@prisma/client';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING'],
  PENDING: ['ACTIVE'],
  ACTIVE: ['CLOSED'],
  CLOSED: [],
};

@Injectable()
export class JobsService {
  private readonly CACHE_PREFIX = 'jobs';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly inngest: InngestService,
    private readonly auditService: AuditService,
    private readonly cache: CacheService,
    private readonly companyContract: CompanyContractService,
  ) {}

  async findAll(query: { page?: number; limit?: number; search?: string; categoryId?: string; type?: string; experience?: string; level?: string; status?: string; salaryMin?: number; salaryMax?: number; wardId?: string; companyId?: string }) {
    const { search, categoryId, type, experience, level, status, salaryMin, salaryMax, wardId, companyId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    
    // Generate cache key from query parameters
    const cacheKey = this.cache.generateKey(
      this.CACHE_PREFIX, 'list',
      String(page), String(limit), search || '', categoryId || '',
      type || '', experience || '', level || '', status || 'ACTIVE',
      String(salaryMin || ''), String(salaryMax || ''), wardId || '', companyId || ''
    );
    
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Prisma.JobWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (status) where.status = status as JobStatus;
    else where.status = JobStatus.ACTIVE; // Default: chỉ trả job ACTIVE cho public queries
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type as JobType;
    if (experience) where.experience = experience as ExperienceLevel;
    if (level) where.level = level as JobLevel;
    if (wardId) where.wardId = wardId;
    if (salaryMin) where.salaryMin = { gte: Number(salaryMin) };
    if (salaryMax) where.salaryMax = { lte: Number(salaryMax) };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where, skip: (Number(page) - 1) * Number(limit), take: Number(limit),
        include: { category: true, company: { select: { id: true, name: true, slug: true, logo: true } }, ward: { include: { district: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);
    
    const result = { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    await this.cache.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async findById(id: string) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, id);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { category: true, company: true, ward: { include: { district: { include: { province: true } } } }, applications: { select: { id: true, status: true, createdAt: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    
    await this.cache.set(cacheKey, job, this.CACHE_TTL);
    return job;
  }

  async findByOwner(ownerId: string, query: { page?: number; limit?: number; status?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const where: Prisma.JobWhereInput = { company: { ownerId } };
    if (query.status && query.status !== 'ALL') where.status = query.status as JobStatus;

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: { category: true, company: { select: { id: true, name: true, slug: true, logo: true } }, ward: { include: { district: true } }, _count: { select: { applications: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, 'slug', slug);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const job = await this.prisma.job.findUnique({
      where: { slug },
      include: { category: true, company: true, ward: { include: { district: { include: { province: true } } } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    
    await this.cache.set(cacheKey, job, this.CACHE_TTL);
    return job;
  }

  async create(userId: string, data: { title: string; description: string; requirements?: string; benefits?: string; quantity?: number; salaryMin?: number; salaryMax?: number; wardId?: string; addressDetail?: string; type?: string; experience?: string; level?: string; deadline?: string; categoryId: string }) {
    const company = await this.companyContract.findByOwnerId(userId);
    if (!company) throw new NotFoundException('You need a company to post jobs');
    const slug = slugify(data.title) + '-' + Date.now().toString(36);
    const job = await this.prisma.job.create({
      data: {
        ...data, slug, companyId: company.id,
        type: data.type as JobType, experience: data.experience as ExperienceLevel, level: data.level as JobLevel,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        status: 'DRAFT',
      },
    });
    await this.invalidateCache();
    return job;
  }

  async update(id: string, userId: string, data: object) {
    const job = await this.prisma.job.findUnique({ where: { id }, include: { company: true } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.company.ownerId !== userId) throw new ForbiddenException('Not company owner');
    const updated = await this.prisma.job.update({ where: { id }, data: data as Prisma.JobUpdateInput });
    await this.invalidateCache();
    return updated;
  }

  async updateStatus(id: string, status: JobStatus) {
    const job = await this.prisma.job.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!job) throw new NotFoundException('Job not found');
    const allowed = VALID_STATUS_TRANSITIONS[job.status] || [];
    if (!allowed.includes(status)) {
      throw new ForbiddenException(`Cannot transition from ${job.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`);
    }

    const updated = await this.prisma.job.update({ where: { id }, data: { status }, select: { id: true, title: true, status: true } });

    await this.auditService.log({
      action: 'job.status.changed',
      entityType: 'Job',
      entityId: id,
      oldValue: job.status,
      newValue: status,
    });

    await this.invalidateCache();
    return updated;
  }

  async remove(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    await this.prisma.job.delete({ where: { id } });
    await this.invalidateCache();
    return { message: 'Job deleted' };
  }

  private async invalidateCache() {
    await this.cache.delPattern(`${this.CACHE_PREFIX}:*`);
  }
}
