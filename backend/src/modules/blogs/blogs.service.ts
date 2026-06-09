import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CacheService } from "../../common/cache/cache.service";
import { Prisma, BlogType } from "@prisma/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@Injectable()
export class BlogsService {
  private readonly CACHE_PREFIX = "blogs";
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isPublished?: boolean;
  }) {
    const { search, categoryId, isPublished } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const cacheKey = this.cache.generateKey(
      this.CACHE_PREFIX,
      "list",
      String(page),
      String(limit),
      search || "",
      categoryId || "",
      String(isPublished),
    );
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Prisma.BlogPostWhereInput = {};
    if (isPublished !== undefined) where.isPublished = isPublished;
    else where.isPublished = true; // Default: chỉ trả blog đã publish cho public queries
    if (categoryId) where.categoryId = categoryId;
    if (search)
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];

    const [items, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    const result = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    await this.cache.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async findBySlug(slug: string) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, "slug", slug);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      await this.prisma.blogPost.update({
        where: { slug },
        data: { views: { increment: 1 } },
      });
      return cached;
    }

    const blog = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });
    if (!blog) throw new NotFoundException("Blog not found");
    await this.prisma.blogPost.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });
    await this.cache.set(cacheKey, blog, this.CACHE_TTL);
    return blog;
  }

  async create(
    authorId: string,
    data: {
      title: string;
      type?: BlogType;
      content?: string;
      landingContent?: { html: string; css: string; js?: string };
      excerpt?: string;
      thumbnail?: string;
      categoryId?: string;
      isPublished?: boolean;
    },
  ) {
    const type = data.type || BlogType.NORMAL;

    if (type === BlogType.NORMAL && !data.content) {
      throw new BadRequestException("content is required when type is NORMAL");
    }
    if (type === BlogType.LANDING_PAGE && !data.landingContent) {
      throw new BadRequestException(
        "landingContent is required when type is LANDING_PAGE",
      );
    }

    const slug = slugify(data.title) + "-" + Date.now().toString(36);
    const blog = await this.prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        type,
        content: type === BlogType.NORMAL ? data.content! : null,
        landingContent:
          type === BlogType.LANDING_PAGE
            ? (data.landingContent as Prisma.InputJsonValue)
            : Prisma.DbNull,
        excerpt: data.excerpt,
        thumbnail: data.thumbnail,
        category: data.categoryId
          ? { connect: { id: data.categoryId } }
          : undefined,
        isPublished: data.isPublished,
        author: { connect: { id: authorId } },
      },
    });
    await this.invalidateCache();
    return blog;
  }

  async update(
    id: string,
    data: {
      title?: string;
      type?: BlogType;
      content?: string;
      landingContent?: { html: string; css: string; js?: string };
      excerpt?: string;
      thumbnail?: string;
      categoryId?: string;
      isPublished?: boolean;
    },
  ) {
    const blog = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException("Blog not found");

    const updateData: Prisma.BlogPostUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
      if (data.title !== blog.title) {
        updateData.slug = slugify(data.title) + "-" + Date.now().toString(36);
      }
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    const effectiveType = data.type || blog.type;

    if (effectiveType === BlogType.NORMAL) {
      if (data.content !== undefined) updateData.content = data.content;
      if (data.landingContent !== undefined)
        updateData.landingContent = Prisma.DbNull;
    } else if (effectiveType === BlogType.LANDING_PAGE) {
      if (data.landingContent !== undefined)
        updateData.landingContent =
          data.landingContent as Prisma.InputJsonValue;
      if (data.content !== undefined) updateData.content = null;
    }

    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
    if (data.categoryId !== undefined) {
      updateData.category = data.categoryId
        ? { connect: { id: data.categoryId } }
        : { disconnect: true };
    }
    if (data.isPublished !== undefined)
      updateData.isPublished = data.isPublished;

    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: updateData,
    });
    await this.invalidateCache();
    return updated;
  }

  async remove(id: string) {
    const blog = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException("Blog not found");
    await this.prisma.blogPost.delete({ where: { id } });
    await this.invalidateCache();
    return { message: "Blog deleted" };
  }

  private async invalidateCache() {
    await this.cache.delPattern(`${this.CACHE_PREFIX}:*`);
  }
}
