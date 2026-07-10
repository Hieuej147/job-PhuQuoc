import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlogsService } from '../src/modules/blogs/blogs.service';
import { Role } from '@prisma/client';

const doc = { type: 'doc', content: [{ type: 'paragraph' }] };

describe('BlogsService', () => {
  let service: BlogsService;
  let prismaMock: any;
  let cacheMock: any;

  beforeEach(() => {
    prismaMock = {
      blogPost: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    cacheMock = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      delPattern: vi.fn().mockResolvedValue(undefined),
      generateKey: vi.fn((...args: string[]) => args.join(':')),
    };
    service = new BlogsService(prismaMock as any, cacheMock as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated blogs and cache result', async () => {
      const mockBlogs = [
        { id: '1', title: 'Blog 1', slug: 'blog-1' },
      ];
      prismaMock.blogPost.findMany.mockResolvedValue(mockBlogs);
      prismaMock.blogPost.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 }) as any;

      expect(result.items).toEqual(mockBlogs);
      expect(result.total).toBe(1);
      expect(cacheMock.set).toHaveBeenCalled();
    });

    it('should return cached result when available', async () => {
      const cachedResult = { items: [{ id: '1', title: 'Cached' }], total: 1, page: 1, limit: 10, totalPages: 1 };
      cacheMock.get.mockResolvedValue(cachedResult);

      const result = await service.findAll({ page: 1, limit: 10 }) as any;

      expect(result).toEqual(cachedResult);
      expect(prismaMock.blogPost.findMany).not.toHaveBeenCalled();
    });

    it('should filter by isPublished', async () => {
      prismaMock.blogPost.findMany.mockResolvedValue([]);
      prismaMock.blogPost.count.mockResolvedValue(0);

      await service.findAll({ isPublished: true });

      expect(prismaMock.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isPublished: true }),
        }),
      );
    });
  });

  describe('findBySlug', () => {
    it('should return blog without incrementing views and cache', async () => {
      const mockBlog = { id: '1', title: 'Blog 1', slug: 'blog-1', views: 10 };
      prismaMock.blogPost.findUnique.mockResolvedValue(mockBlog);

      const result = await service.findBySlug('blog-1') as any;

      expect(result.views).toBe(10);
      expect(prismaMock.blogPost.update).not.toHaveBeenCalled();
      expect(cacheMock.set).toHaveBeenCalled();
    });

    it('should return cached blog when available', async () => {
      const cachedBlog = { id: '1', title: 'Cached Blog', slug: 'blog-1', views: 10 };
      cacheMock.get.mockResolvedValue(cachedBlog);

      const result = await service.findBySlug('blog-1') as any;

      expect(result).toEqual(cachedBlog);
      expect(prismaMock.blogPost.update).not.toHaveBeenCalled();
      expect(prismaMock.blogPost.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when blog not found', async () => {
      cacheMock.get.mockResolvedValue(null);
      prismaMock.blogPost.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow('Blog not found');
    });
  });

  describe('incrementView', () => {
    it('should increment views and invalidate cache', async () => {
      const mockBlog = { id: '1', title: 'Blog 1', slug: 'blog-1', views: 10 };
      prismaMock.blogPost.findUnique.mockResolvedValue(mockBlog);
      prismaMock.blogPost.update.mockResolvedValue({ ...mockBlog, views: 11 });

      const result = await service.incrementView('blog-1') as any;

      expect(result.views).toBe(11);
      expect(prismaMock.blogPost.update).toHaveBeenCalledWith({
        where: { slug: 'blog-1' },
        data: { views: { increment: 1 } },
      });
      expect(cacheMock.del).toHaveBeenCalledWith('blogs:slug:blog-1');
      expect(cacheMock.delPattern).toHaveBeenCalledWith('blogs:*');
    });
  });

  describe('create', () => {
    it('should create blog with auto-generated slug and invalidate cache', async () => {
      const mockBlog = { id: '1', title: 'New Blog', slug: 'new-blog' };
      prismaMock.blogPost.findUnique.mockResolvedValue(null);
      prismaMock.blogPost.create.mockResolvedValue(mockBlog);

      const result = await service.create('author1', {
        title: 'New Blog',
        content: doc,
      });

      expect(result.title).toBe('New Blog');
      expect(result.slug).toBe('new-blog');
      expect(cacheMock.delPattern).toHaveBeenCalledWith('blogs:*');
    });
  });

  describe('update', () => {
    it('should update blog content without changing slug when slug is not provided', async () => {
      const mockBlog = { id: '1', title: 'Blog 1', slug: 'blog-1', authorId: 'author1' };
      prismaMock.blogPost.findUnique.mockResolvedValue(mockBlog);
      prismaMock.blogPost.update.mockResolvedValue({ ...mockBlog, content: doc });

      await service.update('1', 'author1', Role.CANDIDATE, { content: doc });

      expect(prismaMock.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ slug: expect.any(String) }),
        }),
      );
      expect(cacheMock.delPattern).toHaveBeenCalledWith('blogs:*');
    });

    it('should update slug when slug is provided', async () => {
      const mockBlog = { id: '1', title: 'Old Title', slug: 'old-title', authorId: 'author1' };
      prismaMock.blogPost.findUnique
        .mockResolvedValueOnce(mockBlog)
        .mockResolvedValueOnce(null);
      prismaMock.blogPost.update.mockImplementation((args: any) => Promise.resolve(args.data));

      const result = await service.update('1', 'author1', Role.CANDIDATE, { title: 'New Title', slug: 'New Title' });

      expect(result.slug).toBe('new-title');
    });

    it('should throw NotFoundException when blog not found', async () => {
      prismaMock.blogPost.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', 'author1', Role.CANDIDATE, {})).rejects.toThrow('Blog not found');
    });

    it('should reject update from non-author non-admin', async () => {
      prismaMock.blogPost.findUnique.mockResolvedValue({ id: '1', authorId: 'author1' });

      await expect(service.update('1', 'other', Role.CANDIDATE, { content: doc })).rejects.toThrow(
        'Bạn không có quyền chỉnh sửa bài viết này',
      );
    });
  });

  describe('remove', () => {
    it('should delete blog when found and invalidate cache', async () => {
      const mockBlog = { id: '1', title: 'Blog 1', authorId: 'author1' };
      prismaMock.blogPost.findUnique.mockResolvedValue(mockBlog);
      prismaMock.blogPost.delete.mockResolvedValue(mockBlog);

      const result = await service.remove('1', 'author1', Role.CANDIDATE);
      expect(result.message).toBe('Blog deleted');
      expect(cacheMock.delPattern).toHaveBeenCalledWith('blogs:*');
    });

    it('should throw NotFoundException when blog not found', async () => {
      prismaMock.blogPost.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'author1', Role.CANDIDATE)).rejects.toThrow('Blog not found');
    });
  });
});
