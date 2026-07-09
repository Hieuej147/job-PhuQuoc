import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompaniesService } from '../src/modules/companies/companies.service';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prismaMock: any;
  let cacheMock: any;
  let auditServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      company: {
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
      generateKey: vi.fn().mockReturnValue('test-key'),
    };
    auditServiceMock = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    service = new CompaniesService(prismaMock as any, cacheMock as any, auditServiceMock as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated companies', async () => {
      const mockCompanies = [
        { id: '1', name: 'Company 1', slug: 'company-1' },
        { id: '2', name: 'Company 2', slug: 'company-2' },
      ];
      prismaMock.company.findMany.mockResolvedValue(mockCompanies);
      prismaMock.company.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 }) as any;

      expect(result.items).toEqual(mockCompanies);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
    });

    it('should convert page and limit to numbers', async () => {
      prismaMock.company.findMany.mockResolvedValue([]);
      prismaMock.company.count.mockResolvedValue(0);

      await service.findAll({ page: '2' as any, limit: '5' as any });

      expect(prismaMock.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return company when found', async () => {
      const mockCompany = { id: '1', name: 'Company 1', slug: 'company-1' };
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);

      const result = await service.findById('1');
      expect(result).toEqual(mockCompany);
    });

    it('should throw NotFoundException when company not found', async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow('Company not found');
    });
  });

  describe('findBySlug', () => {
    it('should return company when found by slug', async () => {
      const mockCompany = { id: '1', name: 'Company 1', slug: 'company-1' };
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);

      const result = await service.findBySlug('company-1');
      expect(result).toEqual(mockCompany);
    });

    it('should throw NotFoundException when slug not found', async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow('Company not found');
    });
  });

  describe('create', () => {
    it('should create company with auto-generated slug', async () => {
      const mockCompany = { id: '1', name: 'Test Company', slug: 'test-company-abc123' };
      prismaMock.company.findUnique.mockResolvedValue(null);
      prismaMock.company.create.mockResolvedValue(mockCompany);

      const result = await service.create('user1', { name: 'Test Company' });
      expect(result.name).toBe('Test Company');
      expect(result.slug).toMatch(/^test-company-/);
    });

    it('should reject creating a second company for the same employer', async () => {
      prismaMock.company.findUnique.mockResolvedValue({ id: 'company-1' });

      await expect(service.create('user1', { name: 'Another Company' })).rejects.toThrow(
        'Employer already has a company',
      );
      expect(prismaMock.company.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update company when owner', async () => {
      const mockCompany = { id: '1', ownerId: 'user1' };
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.company.update.mockResolvedValue({ ...mockCompany, name: 'Updated' });

      const result = await service.update('1', 'user1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when company not found', async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', 'user1', {})).rejects.toThrow('Company not found');
    });

    it('should throw ForbiddenException when not owner', async () => {
      const mockCompany = { id: '1', ownerId: 'user1' };
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);

      await expect(service.update('1', 'user2', {})).rejects.toThrow('Not company owner');
    });
  });

  describe('remove', () => {
    it('should delete company when found', async () => {
      const mockCompany = { id: '1', name: 'Company 1' };
      prismaMock.company.findUnique.mockResolvedValue(mockCompany);
      prismaMock.company.delete.mockResolvedValue(mockCompany);

      const result = await service.remove('1');
      expect(result.message).toBe('Company deleted');
    });

    it('should throw NotFoundException when company not found', async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow('Company not found');
    });
  });
});
