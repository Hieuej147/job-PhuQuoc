import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriteContractService } from '../shared/contracts/audit.contract';
import { CacheService } from '../../common/cache/cache.service';
import { CompanyContractService } from '../shared/contracts/company.contract';
import { Prisma, JobStatus, JobType, ExperienceLevel, JobLevel } from '@prisma/client';
import { CreateJobDto, JobQueryDto, MyJobsQueryDto, UpdateJobDto } from './dto/job.dto';
import { JobBackgroundService } from './background/job-background.service';

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
    private readonly auditWriteContract: AuditWriteContractService,
    private readonly cache: CacheService,
    private readonly companyContract: CompanyContractService,
    private readonly jobBackground: JobBackgroundService,
  ) { }

  async findAll(query: JobQueryDto) {
    const { search, category, type, experience, level, status, salaryMin, salaryMax, salaryRange, ward, companyId, sort } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    // Generate cache key from query parameters
    const cacheKey = this.cache.generateKey(
      this.CACHE_PREFIX, 'list',
      String(page), String(limit), search || '', category || '',
      type || '', experience || '', level || '', status || 'ACTIVE',
      String(salaryMin || ''), String(salaryMax || ''), salaryRange || '', ward || '', companyId || '', sort || ''
    );

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Prisma.JobWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (status) where.status = status as JobStatus;
    else where.status = JobStatus.ACTIVE; // Default: chỉ trả job ACTIVE cho public queries

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

    // Xác định orderBy dựa trên sort param
    let orderBy: Prisma.JobOrderByWithRelationInput | Prisma.JobOrderByWithRelationInput[] = { createdAt: 'desc' };
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
        include: { category: true, company: { select: { id: true, name: true, slug: true, logo: true } }, ward: { include: { district: true } } },
        orderBy,
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

  async findByOwner(ownerId: string, query: MyJobsQueryDto) {
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

  async create(userId: string, data: CreateJobDto) {
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

    this.jobBackground.syncEmbedding(job);

    return job;
  }

  async update(id: string, userId: string, data: UpdateJobDto) {
    const job = await this.prisma.job.findUnique({ where: { id }, include: { company: true } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.company.ownerId !== userId) throw new ForbiddenException('Not company owner');
    // Reserved for a future "edit draft before checkout" flow.
    // Paid/ACTIVE jobs should not be edited through this path because payment,
    // public listing, Inngest expiry events, and applications are already tied to the activated job.
    const updated = await this.prisma.job.update({ where: { id }, data: data as Prisma.JobUpdateInput });
    await this.invalidateCache();

    this.jobBackground.syncEmbedding(updated);

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

  async getFilterStats() {
    const activeJobsWhere: Prisma.JobWhereInput = {
      status: JobStatus.ACTIVE,
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
