import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditWriteContractService } from '../shared/contracts/audit.contract';
import { Prisma, CompanySize } from '@prisma/client';
import { CompanyQueryDto, CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { createId } from '@paralleldrive/cuid2';

function slugify(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return slug || 'company';
}

function createCompanySlug(name: string): string {
  return `${slugify(name)}-${createId().slice(0, 6)}`;
}

@Injectable()
export class CompaniesService {
  private readonly CACHE_PREFIX = 'companies';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly auditWriteContract: AuditWriteContractService,
  ) { }

  async findAll(query: CompanyQueryDto) {
    const { search } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const cacheKey = this.cache.generateKey(
      this.CACHE_PREFIX, 'list',
      String(page), String(limit), search || ''
    );

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Prisma.CompanyWhereInput = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: {
          ward: { include: { district: { include: { province: true } } } },
          _count: { select: { jobs: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count({ where }),
    ]);

    const result = { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    await this.cache.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async findById(id: string) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, id);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { ward: { include: { district: { include: { province: true } } } }, jobs: { where: { status: 'ACTIVE' }, take: 5 } },
    });
    if (!company) throw new NotFoundException('Company not found');

    await this.cache.set(cacheKey, company, this.CACHE_TTL);
    return company;
  }

  async findByOwnerId(ownerId: string) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId },
      include: { ward: { include: { district: { include: { province: true } } } } },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async findBySlug(slug: string) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, 'slug', slug);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: { ward: { include: { district: { include: { province: true } } } }, jobs: { where: { status: 'ACTIVE' } } },
    });
    if (!company) throw new NotFoundException('Company not found');

    await this.cache.set(cacheKey, company, this.CACHE_TTL);
    return company;
  }

  async create(ownerId: string, data: CreateCompanyDto) {
    let company: Awaited<ReturnType<typeof this.prisma.company.create>> | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug = createCompanySlug(data.name);

      try {
        company = await this.prisma.company.create({
          data: { ...data, slug, ownerId, size: data.size as CompanySize, isApproved: true },
        });
        break;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          Array.isArray(error.meta?.target) &&
          error.meta.target.includes('slug')
        ) {
          continue;
        }
        throw error;
      }
    }

    if (!company) {
      throw new ConflictException('Could not generate unique company slug');
    }

    // Emit audit event
    await this.auditWriteContract.log({
      action: 'company.created',
      entityType: 'Company',
      entityId: company.id,
      actorId: ownerId,
      metadata: { companyName: company.name },
    });

    await this.invalidateCache();
    return company;
  }

  async update(id: string, userId: string, data: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.ownerId !== userId) throw new ForbiddenException('Not company owner');
    const updated = await this.prisma.company.update({ where: { id }, data: { ...data, size: data.size as CompanySize } });
    await this.invalidateCache();
    return updated;
  }

  async remove(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    await this.prisma.company.delete({ where: { id } });
    await this.invalidateCache();
    return { message: 'Company deleted' };
  }

  private async invalidateCache() {
    await this.cache.delPattern(`${this.CACHE_PREFIX}:*`);
  }
}
