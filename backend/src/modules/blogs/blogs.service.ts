import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CacheService } from "../../common/cache/cache.service";
import { Prisma, BlogType, Role } from "@prisma/client";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

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
    category?: string;
    orderBy?: string;
    isPublished?: boolean;
  }) {
    const { search, category, orderBy, isPublished } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const cacheKey = this.cache.generateKey(
      this.CACHE_PREFIX,
      "list",
      String(page),
      String(limit),
      search || "",
      category || "",
      orderBy || "",
      String(isPublished),
    );
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Prisma.BlogPostWhereInput = {};
    if (isPublished !== undefined) where.isPublished = isPublished;
    else where.isPublished = true; // Default: chỉ trả blog đã publish cho public queries
    if (category) {
      const slugs = category.split(',');
      where.category = slugs.length > 1 ? { slug: { in: slugs } } : { slug: slugs[0] };
    }
    if (search)
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];

    let prismaOrderBy: Prisma.BlogPostOrderByWithRelationInput | Prisma.BlogPostOrderByWithRelationInput[] = { createdAt: "desc" };
    if (orderBy === 'views') {
      prismaOrderBy = [{ views: 'desc' }, { createdAt: 'desc' }];
    } else if (orderBy === 'oldest') {
      prismaOrderBy = { createdAt: 'asc' };
    } else if (orderBy === 'newest') {
      prismaOrderBy = { createdAt: 'desc' };
    }

    const [items, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: prismaOrderBy,
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

    await this.cache.set(cacheKey, blog, this.CACHE_TTL);
    return blog;
  }

  async incrementView(slug: string) {
    const blog = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (!blog) throw new NotFoundException("Blog not found");

    const updated = await this.prisma.blogPost.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });

    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, "slug", slug);
    await this.cache.del(cacheKey);
    await this.invalidateCache();

    return updated;
  }

  async create(
    authorId: string,
    data: {
      title: string;
      slug?: string;
      type?: BlogType;
      content?: Record<string, unknown>;
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

    const slug = await this.resolveUniqueSlug(data.slug || data.title);
    const blog = await this.prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        type,
        content:
          type === BlogType.NORMAL
            ? ((data.content || EMPTY_DOC) as Prisma.InputJsonValue)
            : Prisma.DbNull,
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
    userId: string,
    userRole: Role,
    data: {
      title?: string;
      slug?: string;
      type?: BlogType;
      content?: Record<string, unknown>;
      landingContent?: { html: string; css: string; js?: string };
      excerpt?: string;
      thumbnail?: string;
      categoryId?: string;
      isPublished?: boolean;
    },
  ) {
    const blog = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException("Blog not found");

    if (blog.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException("Bạn không có quyền chỉnh sửa bài viết này");
    }

    const updateData: Prisma.BlogPostUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.slug !== undefined) {
      updateData.slug = await this.resolveUniqueSlug(data.slug || data.title || blog.title, id);
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    const effectiveType = data.type || blog.type;

    if (effectiveType === BlogType.NORMAL) {
      if (data.content !== undefined)
        updateData.content = data.content as Prisma.InputJsonValue;
      if (data.landingContent !== undefined)
        updateData.landingContent = Prisma.DbNull;
    } else if (effectiveType === BlogType.LANDING_PAGE) {
      if (data.landingContent !== undefined)
        updateData.landingContent =
          data.landingContent as Prisma.InputJsonValue;
      if (data.content !== undefined) updateData.content = Prisma.DbNull;
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

  async remove(id: string, userId: string, userRole: Role) {
    const blog = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException("Blog not found");

    if (blog.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException("Bạn không có quyền xóa bài viết này");
    }

    await this.prisma.blogPost.delete({ where: { id } });
    await this.invalidateCache();
    return { message: "Blog deleted" };
  }

  async findMyBlogs(
    authorId: string,
    query: { page?: number; limit?: number; search?: string; orderBy?: string },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search || "";
    const orderBy = query.orderBy || "newest";

    const where: Prisma.BlogPostWhereInput = { authorId };

    if (search)
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];

    let prismaOrderBy:
      | Prisma.BlogPostOrderByWithRelationInput
      | Prisma.BlogPostOrderByWithRelationInput[] = { createdAt: "desc" };

    if (orderBy === "views") {
      prismaOrderBy = [{ views: "desc" }, { createdAt: "desc" }];
    } else if (orderBy === "oldest") {
      prismaOrderBy = { createdAt: "asc" };
    }

    const [items, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
        orderBy: prismaOrderBy,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async resolveUniqueSlug(rawSlug: string, ignoreId?: string) {
    const base = slugify(rawSlug) || `bai-viet-${Date.now().toString(36)}`;
    let slug = base;
    let suffix = 1;

    while (true) {
      const existing = await this.prisma.blogPost.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || existing.id === ignoreId) return slug;

      suffix += 1;
      slug = `${base}-${suffix}`;
    }
  }

  private async invalidateCache() {
    await this.cache.delPattern(`${this.CACHE_PREFIX}:*`);
  }
}
