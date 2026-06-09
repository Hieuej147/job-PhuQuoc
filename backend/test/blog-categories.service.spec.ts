import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlogCategoriesService } from '../src/modules/blog-categories/blog-categories.service';

describe('BlogCategoriesService', () => {
  let service: BlogCategoriesService;
  let prismaMock: any;
  let cacheMock: any;

  beforeEach(() => {
    prismaMock = {
      blogCategory: {
        findMany: vi.fn(),
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
      generateKey: vi.fn().mockReturnValue('test-key'),
    };
    service = new BlogCategoriesService(prismaMock as any, cacheMock as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all blog categories ordered by name', async () => {
      const mockCategories = [
        { id: '1', name: 'Category A', slug: 'category-a' },
      ];
      prismaMock.blogCategory.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();
      expect(result).toEqual(mockCategories);
    });
  });

  describe('create', () => {
    it('should create blog category with auto-generated slug', async () => {
      const mockCategory = { id: '1', name: 'New Category', slug: 'new-category' };
      prismaMock.blogCategory.create.mockResolvedValue(mockCategory);

      const result = await service.create({ name: 'New Category' });
      expect(result.name).toBe('New Category');
      expect(result.slug).toBe('new-category');
    });
  });

  describe('update', () => {
    it('should update blog category', async () => {
      const mockCategory = { id: '1', name: 'Category 1', slug: 'category-1' };
      prismaMock.blogCategory.update.mockResolvedValue({ ...mockCategory, name: 'Updated' });

      const result = await service.update('1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete blog category', async () => {
      prismaMock.blogCategory.delete.mockResolvedValue({ id: '1' });

      const result = await service.remove('1');
      expect(result.message).toBe('Blog category deleted');
    });
  });
});
