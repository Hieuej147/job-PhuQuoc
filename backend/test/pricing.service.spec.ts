import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PricingService } from '../src/modules/pricing/pricing.service';

describe('PricingService', () => {
  let service: PricingService;
  let prismaMock: any;
  let cacheMock: any;
  let paymentContractMock: any;

  beforeEach(() => {
    prismaMock = {
      pricingPackage: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      payment: {
        count: vi.fn(),
      },
    };
    cacheMock = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      delPattern: vi.fn().mockResolvedValue(undefined),
      generateKey: vi.fn().mockReturnValue('test-key'),
    };
    paymentContractMock = {
      findById: vi.fn(),
      findByJobId: vi.fn(),
      countByPackageId: vi.fn().mockResolvedValue(0),
    };
    service = new PricingService(prismaMock as any, cacheMock as any, paymentContractMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all packages', async () => {
      const mockPackages = [
        { id: '1', name: 'Basic', days: 7, price: 50000 },
        { id: '2', name: 'Pro', days: 14, price: 100000 },
      ];
      prismaMock.pricingPackage.findMany.mockResolvedValue(mockPackages);

      const result = await service.findAll();
      expect(result).toEqual(mockPackages);
    });

    it('should filter active packages when activeOnly is true', async () => {
      prismaMock.pricingPackage.findMany.mockResolvedValue([]);

      await service.findAll(true);

      expect(prismaMock.pricingPackage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return package when found', async () => {
      const mockPackage = { id: '1', name: 'Basic', days: 7, price: 50000 };
      prismaMock.pricingPackage.findUnique.mockResolvedValue(mockPackage);

      const result = await service.findById('1');
      expect(result).toEqual(mockPackage);
    });

    it('should throw NotFoundException when package not found', async () => {
      prismaMock.pricingPackage.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow('Pricing package not found');
    });
  });

  describe('create', () => {
    it('should create package', async () => {
      const mockPackage = { id: '1', name: 'Basic', days: 7, price: 50000, isActive: true };
      prismaMock.pricingPackage.create.mockResolvedValue(mockPackage);

      const result = await service.create({ name: 'Basic', days: 7, price: 50000 });
      expect(result).toEqual(mockPackage);
    });
  });

  describe('update', () => {
    it('should update package', async () => {
      const mockPackage = { id: '1', name: 'Basic', days: 7, price: 50000 };
      prismaMock.pricingPackage.findUnique.mockResolvedValue(mockPackage);
      prismaMock.pricingPackage.update.mockResolvedValue({ ...mockPackage, price: 60000 });

      const result = await service.update('1', { price: 60000 });
      expect(result.price).toBe(60000);
    });

    it('should throw NotFoundException when package not found', async () => {
      prismaMock.pricingPackage.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow('Pricing package not found');
    });
  });

  describe('remove', () => {
    it('should delete package when no payments exist', async () => {
      const mockPackage = { id: '1', name: 'Basic' };
      prismaMock.pricingPackage.findUnique.mockResolvedValue(mockPackage);
      paymentContractMock.countByPackageId.mockResolvedValue(0);
      prismaMock.pricingPackage.delete.mockResolvedValue(mockPackage);

      const result = await service.remove('1');
      expect(result.message).toBe('Pricing package deleted');
    });

    it('should throw NotFoundException when package has payments', async () => {
      const mockPackage = { id: '1', name: 'Basic' };
      prismaMock.pricingPackage.findUnique.mockResolvedValue(mockPackage);
      paymentContractMock.countByPackageId.mockResolvedValue(5);

      await expect(service.remove('1')).rejects.toThrow('Cannot delete package with existing payments');
    });

    it('should throw NotFoundException when package not found', async () => {
      prismaMock.pricingPackage.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow('Pricing package not found');
    });
  });
});
