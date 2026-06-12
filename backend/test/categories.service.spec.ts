import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoriesService } from '../src/modules/categories/categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaMock: any;
  let cacheMock: any;
  let jobContractMock: any;

  beforeEach(() => {
    prismaMock = {
      jobCategory: {
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
    jobContractMock = {
      countByCategoryId: vi.fn().mockResolvedValue(0),
    };
    service = new CategoriesService(prismaMock as any, cacheMock as any, jobContractMock as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return categories ordered by job count', async () => {
      const mockCategories = [
        { id: '1', name: 'Category A', slug: 'category-a', _count: { jobs: 2 } },
        { id: '2', name: 'Category B', slug: 'category-b', _count: { jobs: 5 } },
      ];
      prismaMock.jobCategory.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toEqual([
        expect.objectContaining({ id: '2', jobCount: 5 }),
        expect.objectContaining({ id: '1', jobCount: 2 }),
      ]);
      expect(prismaMock.jobCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { _count: { select: { jobs: true } } },
        }),
      );
    });

    it('should limit categories when requested', async () => {
      prismaMock.jobCategory.findMany.mockResolvedValue([
        { id: '1', name: 'Category A', slug: 'category-a', _count: { jobs: 1 } },
        { id: '2', name: 'Category B', slug: 'category-b', _count: { jobs: 3 } },
      ]);

      const result = await service.findAll({ limit: 1 }) as Array<{ id: string; jobCount: number }>;

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({ id: '2', jobCount: 3 }));
    });
  });

  describe('findById', () => {
    it('should return category when found', async () => {
      const mockCategory = { id: '1', name: 'Category 1', slug: 'category-1' };
      prismaMock.jobCategory.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findById('1');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      prismaMock.jobCategory.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow('Category not found');
    });
  });

  describe('create', () => {
    it('should create category with auto-generated slug', async () => {
      const mockCategory = { id: '1', name: 'New Category', slug: 'new-category' };
      prismaMock.jobCategory.create.mockResolvedValue(mockCategory);

      const result = await service.create({ name: 'New Category' });
      expect(result.name).toBe('New Category');
      expect(result.slug).toBe('new-category');
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      const mockCategory = { id: '1', name: 'Category 1', slug: 'category-1' };
      prismaMock.jobCategory.findUnique.mockResolvedValue(mockCategory);
      prismaMock.jobCategory.update.mockResolvedValue({ ...mockCategory, name: 'Updated' });

      const result = await service.update('1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should regenerate slug when name changes', async () => {
      const mockCategory = { id: '1', name: 'Old Name', slug: 'old-name' };
      prismaMock.jobCategory.findUnique.mockResolvedValue(mockCategory);
      prismaMock.jobCategory.update.mockImplementation((args: any) => Promise.resolve(args.data));

      const result = await service.update('1', { name: 'New Name' });
      expect(result.slug).toBe('new-name');
    });

    it('should throw NotFoundException when category not found', async () => {
      prismaMock.jobCategory.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow('Category not found');
    });
  });

  describe('remove', () => {
    it('should delete category', async () => {
      const mockCategory = { id: '1', name: 'Category 1', slug: 'category-1' };
      prismaMock.jobCategory.findUnique.mockResolvedValue(mockCategory);
      prismaMock.jobCategory.delete.mockResolvedValue({ id: '1' });

      const result = await service.remove('1');
      expect(result.message).toBe('Category deleted');
    });
  });
});
