import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlogsService } from '../src/modules/blogs/blogs.service';

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
    it('should return blog, increment views, and cache', async () => {
      const mockBlog = { id: '1', title: 'Blog 1', slug: 'blog-1', views: 10 };
      prismaMock.blogPost.findUnique.mockResolvedValue(mockBlog);
      prismaMock.blogPost.update.mockResolvedValue({ ...mockBlog, views: 11 });

      const result = await service.findBySlug('blog-1') as any;

      expect(result.views).toBe(10);
      expect(cacheMock.set).toHaveBeenCalled();
    });

    it('should return cached blog when available', async () => {
      const cachedBlog = { id: '1', title: 'Cached Blog', slug: 'blog-1', views: 10 };
      cacheMock.get.mockResolvedValue(cachedBlog);
      prismaMock.blogPost.update.mockResolvedValue({ ...cachedBlog, views: 11 });

      const result = await service.findBySlug('blog-1') as any;

      expect(result).toEqual(cachedBlog);
      expect(prismaMock.blogPost.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when blog not found', async () => {
      cacheMock.get.mockResolvedValue(null);
      prismaMock.blogPost.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow('Blog not found');
    });
  });

  describe('create', () => {
    it('should create blog with auto-generated slug and invalidate cache', async () => {
      const mockBlog = { id: '1', title: 'New Blog', slug: 'new-blog-abc123' };
      prismaMock.blogPost.create.mockResolvedValue(mockBlog);

      const result = await service.create('author1', {
        title: 'New Blog',
        content: 'Blog content',
      });

      expect(result.title).toBe('New Blog');
      expect(result.slug).toMatch(/^new-blog-/);
      expect(cacheMock.delPattern).toHaveBeenCalledWith('blogs:*');
    });
  });

  describe('update', () => {
    it('should update blog without changing slug when title unchanged', async () => {
      const mockBlog = { id: '1', title: 'Blog 1', slug: 'blog-1' };
      prismaMock.blogPost.findUnique.mockResolvedValue(mockBlog);
      prismaMock.blogPost.update.mockResolvedValue({ ...mockBlog, content: 'Updated' });

      await service.update('1', { content: 'Updated' });

      expect(prismaMock.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ slug: expect.any(String) }),
        }),
      );
      expect(cacheMock.delPattern).toHaveBeenCalledWith('blogs:*');
    });

    it('should regenerate slug when title changes', async () => {
      const mockBlog = { id: '1', title: 'Old Title', slug: 'old-title' };
      prismaMock.blogPost.findUnique.mockResolvedValue(mockBlog);
      prismaMock.blogPost.update.mockImplementation((args: any) => Promise.resolve(args.data));

      const result = await service.update('1', { title: 'New Title' });

      expect(result.slug).toMatch(/^new-title-/);
    });

    it('should throw NotFoundException when blog not found', async () => {
      prismaMock.blogPost.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow('Blog not found');
    });
  });

  describe('remove', () => {
    it('should delete blog when found and invalidate cache', async () => {
      const mockBlog = { id: '1', title: 'Blog 1' };
      prismaMock.blogPost.findUnique.mockResolvedValue(mockBlog);
      prismaMock.blogPost.delete.mockResolvedValue(mockBlog);

      const result = await service.remove('1');
      expect(result.message).toBe('Blog deleted');
      expect(cacheMock.delPattern).toHaveBeenCalledWith('blogs:*');
    });

    it('should throw NotFoundException when blog not found', async () => {
      prismaMock.blogPost.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow('Blog not found');
    });
  });
});
