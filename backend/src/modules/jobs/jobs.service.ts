import { BadRequestException, ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriteContractService } from '../shared/contracts/audit.contract';
import { CacheService } from '../../common/cache/cache.service';
import { CompanyContractService } from '../shared/contracts/company.contract';
import { Prisma, JobStatus, JobType, ExperienceLevel, JobLevel } from '@prisma/client';
import { CreateJobDto, JobQueryDto, MyJobsQueryDto, UpdateJobDto } from './dto/job.dto';
import { JobBackgroundService } from './background/job-background.service';
import { QuotaService } from '../../common/quota/quota.service';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING'],
  PENDING: ['ACTIVE'],
  ACTIVE: ['CLOSED', 'EXPIRED'],
  CLOSED: [],
  EXPIRED: [],
};

function isArchivedQuery(value?: string) {
  return value === 'true' || value === '1' || value === 'ARCHIVED';
}

@Injectable()
export class JobsService {
  private readonly CACHE_PREFIX = 'jobs';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditWriteContract: AuditWriteContractService,
    private readonly cache: CacheService,
    private readonly companyContract: CompanyContractService,
    private readonly jobBackground: JobBackgroundService,
    private readonly quotaService: QuotaService,
  ) { }

  private async assertWardExists(wardId: string) {
    const ward = await this.prisma.addressWard.findUnique({
      where: { id: wardId },
      select: { id: true },
    });
    if (!ward) {
      throw new BadRequestException('Khu vực làm việc không hợp lệ');
    }
  }

  private async normalizeCreateLocation(data: CreateJobDto) {
    const wardId = data.wardId?.trim();
    const addressDetail = data.addressDetail?.trim();

    if (!wardId) {
      throw new BadRequestException('Vui lòng chọn khu vực làm việc');
    }
    if (!addressDetail) {
      throw new BadRequestException('Vui lòng nhập địa chỉ làm việc chi tiết');
    }

    await this.assertWardExists(wardId);
    return { ...data, wardId, addressDetail };
  }

  private async normalizeUpdateLocation(job: { wardId: string | null; addressDetail: string | null }, data: UpdateJobDto) {
    const rawWardId = data.wardId === undefined ? job.wardId : data.wardId;
    const rawAddressDetail = data.addressDetail === undefined ? job.addressDetail : data.addressDetail;
    const wardId = rawWardId?.trim();
    const addressDetail = rawAddressDetail?.trim();

    if (!wardId) {
      throw new BadRequestException('Vui lòng chọn khu vực làm việc');
    }
    if (!addressDetail) {
      throw new BadRequestException('Vui lòng nhập địa chỉ làm việc chi tiết');
    }

    await this.assertWardExists(wardId);
    return { ...data, wardId, addressDetail };
  }

  async findAll(query: JobQueryDto) {
    const { search, category, type, experience, level, salaryMin, salaryMax, salaryRange, ward, companyId, sort } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    // Generate cache key from query parameters
    const cacheKey = this.cache.generateKey(
      this.CACHE_PREFIX, 'list',
      String(page), String(limit), search || '', category || '',
      type || '', experience || '', level || '', 'ACTIVE',
      String(salaryMin || ''), String(salaryMax || ''), salaryRange || '', ward || '', companyId || '', sort || ''
    );

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Prisma.JobWhereInput = {};
    if (companyId) where.companyId = companyId;
    where.status = JobStatus.ACTIVE; // Public queries never expose DRAFT/PENDING/CLOSED/EXPIRED jobs.
    where.archivedAt = null;

    if (category) {
      const slugs = category.split(',');
      where.category = slugs.length > 1 ? { slug: { in: slugs } } : { slug: slugs[0] };
    }
    if (type) {
      const types = type.split(',') as JobType[];
      where.type = types.length > 1 ? { in: types } : types[0];
    }
    if (experience) {
      const exps = experience.split(',') as ExperienceLevel[];
      where.experience = exps.length > 1 ? { in: exps } : exps[0];
    }
    if (level) {
      const lvls = level.split(',') as JobLevel[];
      where.level = lvls.length > 1 ? { in: lvls } : lvls[0];
    }
    if (ward) {
      const slugs = ward.split(',');
      where.ward = slugs.length > 1 ? { slug: { in: slugs } } : { slug: slugs[0] };
    }
    if (salaryMin) where.salaryMin = { gte: Number(salaryMin) };
    if (salaryMax) where.salaryMax = { lte: Number(salaryMax) };

    if (salaryRange) {
      const ranges = salaryRange.split(',');
      const rangeQueries = [];
      for (const range of ranges) {
        if (range === 'under_5') {
          rangeQueries.push({
            OR: [
              { salaryMin: { lt: 5000000 } },
              { AND: [{ salaryMin: null }, { salaryMax: { lt: 5000000 } }] }
            ]
          });
        } else if (range === '5_10') {
          rangeQueries.push({
            AND: [
              { OR: [{ salaryMin: null }, { salaryMin: { lt: 10000000 } }] },
              { OR: [{ salaryMax: null }, { salaryMax: { gte: 5000000 } }] }
            ]
          });
        } else if (range === '10_20') {
          rangeQueries.push({
            AND: [
              { OR: [{ salaryMin: null }, { salaryMin: { lt: 20000000 } }] },
              { OR: [{ salaryMax: null }, { salaryMax: { gte: 10000000 } }] }
            ]
          });
        } else if (range === '20_30') {
          rangeQueries.push({
            AND: [
              { OR: [{ salaryMin: null }, { salaryMin: { lt: 30000000 } }] },
              { OR: [{ salaryMax: null }, { salaryMax: { gte: 20000000 } }] }
            ]
          });
        } else if (range === 'over_30') {
          rangeQueries.push({
            OR: [
              { salaryMin: { gte: 30000000 } },
              { salaryMax: { gte: 30000000 } }
            ]
          });
        }
      }
      if (rangeQueries.length > 0) {
        where.OR = rangeQueries;
      }
    }
    where.AND = [
      {
        OR: [
          { deadline: null },
          { deadline: { gte: new Date() } }
        ]
      }
    ];

    if (search) {
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    // Mặc định ưu tiên tin đã trả phí Top; sort cụ thể từ user sẽ override thứ tự này.
    let orderBy: Prisma.JobOrderByWithRelationInput | Prisma.JobOrderByWithRelationInput[] = [
      { boostLevel: 'desc' },
      { featuredUntil: 'desc' },
      { publishedAt: 'desc' },
      { createdAt: 'desc' },
    ];
    if (sort === 'salary_asc') {
      orderBy = [{ salaryMin: 'asc' }, { salaryMax: 'asc' }, { createdAt: 'desc' }];
    } else if (sort === 'salary_desc') {
      orderBy = [{ salaryMax: 'desc' }, { salaryMin: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'expiring_soon') {
      orderBy = [{ deadline: 'asc' }, { createdAt: 'desc' }];
    }

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where, skip: (Number(page) - 1) * Number(limit), take: Number(limit),
        include: {
          category: true,
          company: { select: { id: true, name: true, slug: true, logo: true } },
          ward: { include: { district: true } },
          _count: { select: { applications: true } },
        },
        orderBy,
      }),
      this.prisma.job.count({ where }),
    ]);

    const result = { items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    await this.cache.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async findById(id: string) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, 'public-id', id);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        category: true,
        company: true,
        ward: { include: { district: { include: { province: true } } } },
        applications: { select: { id: true, status: true, createdAt: true } },
        _count: { select: { applications: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (
      job.archivedAt ||
      job.status !== JobStatus.ACTIVE ||
      (job.deadline && job.deadline.getTime() < Date.now())
    ) {
      throw new NotFoundException('Job not found');
    }

    await this.cache.set(cacheKey, job, this.CACHE_TTL);
    return job;
  }

  async findManagedById(id: string, ownerId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        category: true,
        company: true,
        ward: { include: { district: { include: { province: true } } } },
        applications: { select: { id: true, status: true, createdAt: true } },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { package: true },
        },
        _count: { select: { applications: true, payments: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.company.ownerId !== ownerId) throw new ForbiddenException('Not company owner');
    return job;
  }

  async findByOwner(ownerId: string, query: MyJobsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const showArchived = isArchivedQuery(query.archived) || query.status === 'ARCHIVED';
    const where: Prisma.JobWhereInput = {
      company: { ownerId },
      archivedAt: showArchived ? { not: null } : null,
    };
    if (query.status && query.status !== 'ALL' && query.status !== 'ARCHIVED') where.status = query.status as JobStatus;
    if (query.search?.trim()) {
      where.title = { contains: query.search.trim(), mode: 'insensitive' };
    }

    let orderBy: Prisma.JobOrderByWithRelationInput | Prisma.JobOrderByWithRelationInput[] = { createdAt: 'desc' };
    if (query.sort === 'most-apps') {
      orderBy = { applications: { _count: 'desc' } };
    } else if (query.sort === 'expiring') {
      orderBy = [{ deadline: 'asc' }, { createdAt: 'desc' }];
    }

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: { category: true, company: { select: { id: true, name: true, slug: true, logo: true } }, ward: { include: { district: true } }, _count: { select: { applications: true } } },
        orderBy,
      }),
      this.prisma.job.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOwnerJobStats(ownerId: string) {
    const counts = await this.prisma.job.groupBy({
      by: ['status'],
      where: { company: { ownerId }, archivedAt: null },
      _count: { id: true },
    });

    const stats = { ALL: 0, ACTIVE: 0, PENDING: 0, DRAFT: 0, CLOSED: 0, EXPIRED: 0, ARCHIVED: 0 };
    for (const item of counts) {
      stats[item.status] = item._count.id;
      stats.ALL += item._count.id;
    }
    stats.ARCHIVED = await this.prisma.job.count({ where: { company: { ownerId }, archivedAt: { not: null } } });

    return stats;
  }

  async findBySlug(slug: string) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, 'slug', slug);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const job = await this.prisma.job.findUnique({
      where: { slug },
      include: {
        category: true,
        company: true,
        ward: { include: { district: { include: { province: true } } } },
        _count: { select: { applications: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (
      job.archivedAt ||
      job.status !== JobStatus.ACTIVE ||
      (job.deadline && job.deadline.getTime() < Date.now())
    ) {
      throw new NotFoundException('Job not found');
    }

    await this.cache.set(cacheKey, job, this.CACHE_TTL);
    return job;
  }

  async create(userId: string, data: CreateJobDto) {
    const company = await this.companyContract.findByOwnerId(userId);
    if (!company) throw new NotFoundException('You need a company to post jobs');
    const normalizedData = await this.normalizeCreateLocation(data);
    const usedJobs = await this.countEmployerJobQuotaUsage(userId);
    await this.quotaService.assertWithinForUser(userId, 'employerJobs', usedJobs);
    const slug = slugify(normalizedData.title) + '-' + Date.now().toString(36);
    const job = await this.prisma.job.create({
      data: {
        ...normalizedData, slug, companyId: company.id,
        type: normalizedData.type as JobType, experience: normalizedData.experience as ExperienceLevel, level: normalizedData.level as JobLevel,
        status: 'DRAFT',
      },
    });
    await this.invalidateCache();

    return job;
  }

  async update(id: string, userId: string, data: UpdateJobDto) {
    const job = await this.prisma.job.findUnique({ where: { id }, include: { company: true } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.company.ownerId !== userId) throw new ForbiddenException('Not company owner');
    if (job.archivedAt) throw new ConflictException('Archived jobs must be restored before editing');
    const normalizedData = await this.normalizeUpdateLocation(job, data);
    const updated = await this.prisma.job.update({ where: { id }, data: normalizedData as Prisma.JobUpdateInput });
    await this.invalidateCache();

    if (
      updated.status === JobStatus.ACTIVE &&
      !updated.archivedAt &&
      (!updated.deadline || updated.deadline.getTime() >= Date.now())
    ) {
      this.jobBackground.syncEmbedding(updated);
    }

    return updated;
  }

  async closeEarly(id: string, userId: string) {
    const job = await this.prisma.job.findUnique({ where: { id }, include: { company: true } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.company.ownerId !== userId) throw new ForbiddenException('Not company owner');
    if (job.archivedAt) throw new ConflictException('Archived jobs are already hidden');
    if (job.status !== JobStatus.ACTIVE) {
      throw new ForbiddenException('Only active jobs can be closed early');
    }

    const updated = await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.CLOSED,
        closedAt: new Date(),
        closeReason: 'EMPLOYER_CLOSED',
      },
      include: { _count: { select: { applications: true } } },
    });

    await this.auditWriteContract.log({
      action: 'job.closed.early',
      entityType: 'Job',
      entityId: id,
      actorId: userId,
      oldValue: JobStatus.ACTIVE,
      newValue: JobStatus.CLOSED,
    });

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

    await this.auditWriteContract.log({
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

  async removeForEmployer(id: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.company.ownerId !== userId) throw new ForbiddenException('Not company owner');

    if (job.archivedAt) {
      return { mode: 'archived', message: 'Job already archived', job };
    }

    const now = new Date();
    const updated = await this.prisma.job.update({
      where: { id },
      data: {
        archivedAt: now,
        archivedBy: userId,
        archiveReason: job.status === JobStatus.ACTIVE ? 'EMPLOYER_ARCHIVED_ACTIVE_JOB' : 'EMPLOYER_ARCHIVED',
        ...(job.status === JobStatus.ACTIVE
          ? { status: JobStatus.CLOSED, closedAt: now, closeReason: 'EMPLOYER_ARCHIVED' as any }
          : {}),
      },
    });

    await this.auditWriteContract.log({
      action: 'job.archived.employer',
      entityType: 'Job',
      entityId: id,
      actorId: userId,
      oldValue: job.status,
      newValue: updated.status,
      metadata: { reason: updated.archiveReason },
    });
    await this.invalidateCache();
    return { mode: 'archived', message: 'Job archived', job: updated };
  }

  async restoreForEmployer(id: string, userId: string) {
    const job = await this.prisma.job.findUnique({ where: { id }, include: { company: true } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.company.ownerId !== userId) throw new ForbiddenException('Not company owner');
    if (!job.archivedAt) return job;

    const updated = await this.prisma.job.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedBy: null,
        archiveReason: null,
      },
    });

    await this.auditWriteContract.log({
      action: 'job.restored.employer',
      entityType: 'Job',
      entityId: id,
      actorId: userId,
      oldValue: 'ARCHIVED',
      newValue: updated.status,
    });
    await this.invalidateCache();
    return updated;
  }

  private countEmployerJobQuotaUsage(userId: string) {
    return this.prisma.job.count({
      where: {
        company: { ownerId: userId },
        OR: [
          { archivedAt: null },
          { publishedAt: { not: null } },
          { currentPaymentId: { not: null } },
          { payments: { some: { status: 'COMPLETED' } } },
        ],
      },
    });
  }

  async getFilterStats() {
    const activeJobsWhere: Prisma.JobWhereInput = {
      status: JobStatus.ACTIVE,
      archivedAt: null,
      AND: [
        {
          OR: [
            { deadline: null },
            { deadline: { gte: new Date() } }
          ]
        }
      ]
    };

    // Get count by type
    const typeGroup = await this.prisma.job.groupBy({
      by: ['type'],
      where: activeJobsWhere,
      _count: { id: true },
    });

    // Get count by experience
    const experienceGroup = await this.prisma.job.groupBy({
      by: ['experience'],
      where: activeJobsWhere,
      _count: { id: true },
    });

    // Get count by level
    const levelGroup = await this.prisma.job.groupBy({
      by: ['level'],
      where: activeJobsWhere,
      _count: { id: true },
    });

    // Get count by salary ranges
    // Under 5M: salaryMin < 5000000 or (salaryMin is null/unspecified and salaryMax < 5000000)
    const salaryUnder5 = await this.prisma.job.count({
      where: {
        ...activeJobsWhere,
        AND: [
          ...(activeJobsWhere.AND as any),
          {
            OR: [
              { salaryMin: { lt: 5000000 } },
              { AND: [{ salaryMin: null }, { salaryMax: { lt: 5000000 } }] }
            ]
          }
        ]
      }
    });

    // 5 - 10M: salaryMin < 10000000 and (salaryMax is null/unspecified or salaryMax >= 5000000)
    const salary5to10 = await this.prisma.job.count({
      where: {
        ...activeJobsWhere,
        AND: [
          ...(activeJobsWhere.AND as any),
          {
            AND: [
              { OR: [{ salaryMin: null }, { salaryMin: { lt: 10000000 } }] },
              { OR: [{ salaryMax: null }, { salaryMax: { gte: 5000000 } }] }
            ]
          }
        ]
      }
    });

    // 10 - 20M: salaryMin < 20000000 and (salaryMax is null/unspecified or salaryMax >= 10000000)
    const salary10to20 = await this.prisma.job.count({
      where: {
        ...activeJobsWhere,
        AND: [
          ...(activeJobsWhere.AND as any),
          {
            AND: [
              { OR: [{ salaryMin: null }, { salaryMin: { lt: 20000000 } }] },
              { OR: [{ salaryMax: null }, { salaryMax: { gte: 10000000 } }] }
            ]
          }
        ]
      }
    });

    // 20 - 30M: salaryMin < 30000000 and (salaryMax is null/unspecified or salaryMax >= 20000000)
    const salary20to30 = await this.prisma.job.count({
      where: {
        ...activeJobsWhere,
        AND: [
          ...(activeJobsWhere.AND as any),
          {
            AND: [
              { OR: [{ salaryMin: null }, { salaryMin: { lt: 30000000 } }] },
              { OR: [{ salaryMax: null }, { salaryMax: { gte: 20000000 } }] }
            ]
          }
        ]
      }
    });

    // Over 30M: salaryMax >= 30000000 or salaryMin >= 30000000
    const salaryOver30 = await this.prisma.job.count({
      where: {
        ...activeJobsWhere,
        AND: [
          ...(activeJobsWhere.AND as any),
          {
            OR: [
              { salaryMin: { gte: 30000000 } },
              { salaryMax: { gte: 30000000 } }
            ]
          }
        ]
      }
    });

    return {
      type: typeGroup.reduce((acc, curr) => {
        acc[curr.type] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
      experience: experienceGroup.reduce((acc, curr) => {
        if (curr.experience) acc[curr.experience] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
      level: levelGroup.reduce((acc, curr) => {
        if (curr.level) acc[curr.level] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
      salary: {
        under_5: salaryUnder5,
        '5_10': salary5to10,
        '10_20': salary10to20,
        '20_30': salary20to30,
        over_30: salaryOver30,
      }
    };
  }

  private async invalidateCache() {
    await Promise.all([
      this.cache.delPattern(`${this.CACHE_PREFIX}:*`),
      this.cache.delPattern(`categories:*`),
    ]);
  }

  async vectorSearch(embedding: number[], limit: number = 10) {
    const vectorString = `[${embedding.join(',')}]`;

    const results = await this.prisma.$queryRaw`
      SELECT 
        j.id, j.title, j.slug, j."salaryMin", j."salaryMax", j.type, j."wardId",
        c.name as "companyName", c.logo as "companyLogo",
        1 - (je.embedding <=> ${vectorString}::vector) as similarity
      FROM "job" j
      JOIN "job_embedding" je ON j.id = je."jobId"
      JOIN "company" c ON j."companyId" = c.id
      WHERE j.status = 'ACTIVE'
        AND j."archivedAt" IS NULL
        AND (j.deadline IS NULL OR j.deadline >= NOW())
      ORDER BY je.embedding <=> ${vectorString}::vector
      LIMIT ${limit}
    `;

    return Array.isArray(results) ? results.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      company: r.companyName,
      companyLogo: r.companyLogo,
      salary: `${r.salaryMin || '?'} - ${r.salaryMax || '?'}`,
      location: r.wardId,
      type: r.type,
      similarity: r.similarity
    })) : [];
  }
}
