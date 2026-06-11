import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { JobContractService } from '../shared/contracts/job.contract';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

@Injectable()
export class CategoriesService {
  private readonly CACHE_PREFIX = 'categories';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly jobContract: JobContractService,
  ) { }

  async findAll() {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, 'all');
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.jobCategory.findMany({
      include: {
        _count: {
          select: { jobs: true }
        }
      }
    });

    const sorted = categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      jobCount: c._count.jobs
    })).sort((a, b) => b.jobCount - a.jobCount);

    await this.cache.set(cacheKey, sorted, this.CACHE_TTL);
    return sorted;
  }

  async findById(id: string) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, id);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached as { id: string; name: string; slug: string; icon: string | null };

    const cat = await this.prisma.jobCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');

    await this.cache.set(cacheKey, cat, this.CACHE_TTL);
    return cat;
  }

  async create(data: { name: string; icon?: string }) {
    const category = await this.prisma.jobCategory.create({ data: { ...data, slug: slugify(data.name) } });
    await this.invalidateCache();
    return category;
  }

  async update(id: string, data: { name?: string; icon?: string }) {
    const cat = await this.findById(id);
    const updated = await this.prisma.jobCategory.update({ where: { id }, data: { ...data, slug: data.name ? slugify(data.name) : cat.slug } });
    await this.invalidateCache();
    return updated;
  }

  async remove(id: string) {
    await this.findById(id);
    const jobCount = await this.jobContract.countByCategoryId(id);
    if (jobCount > 0) {
      throw new ConflictException(`Cannot delete category with ${jobCount} associated jobs. Remove or reassign jobs first.`);
    }
    await this.prisma.jobCategory.delete({ where: { id } });
    await this.invalidateCache();
    return { message: 'Category deleted' };
  }

  private async invalidateCache() {
    await this.cache.delPattern(`${this.CACHE_PREFIX}:*`);
  }
}
