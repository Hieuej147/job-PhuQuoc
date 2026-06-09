import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

@Injectable()
export class BlogCategoriesService {
  private readonly CACHE_PREFIX = 'blog_categories';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findAll() {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, 'all');
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.blogCategory.findMany({ orderBy: { name: 'asc' } });
    await this.cache.set(cacheKey, categories, this.CACHE_TTL);
    return categories;
  }

  async create(data: { name: string }) {
    const category = await this.prisma.blogCategory.create({ data: { ...data, slug: slugify(data.name) } });
    await this.invalidateCache();
    return category;
  }

  async update(id: string, data: { name?: string }) {
    const updated = await this.prisma.blogCategory.update({ where: { id }, data: { ...data, slug: data.name ? slugify(data.name) : undefined } });
    await this.invalidateCache();
    return updated;
  }

  async remove(id: string) {
    await this.prisma.blogCategory.delete({ where: { id } });
    await this.invalidateCache();
    return { message: 'Blog category deleted' };
  }

  private async invalidateCache() {
    await this.cache.delPattern(`${this.CACHE_PREFIX}:*`);
  }
}
