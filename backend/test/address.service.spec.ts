import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddressService } from '../src/modules/address/address.service';

describe('AddressService', () => {
  let service: AddressService;
  let prismaMock: any;
  let cacheMock: any;

  beforeEach(() => {
    prismaMock = {
      addressProvince: {
        findMany: vi.fn(),
      },
      addressDistrict: {
        findMany: vi.fn(),
      },
      addressWard: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    };
    cacheMock = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      delPattern: vi.fn().mockResolvedValue(undefined),
      generateKey: vi.fn().mockReturnValue('test-key'),
    };
    service = new AddressService(prismaMock as any, cacheMock as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTree', () => {
    it('should return nested provinces with districts and wards', async () => {
      const mockTree = [
        {
          id: 'province-1',
          name: 'Kiên Giang',
          districts: [
            {
              id: 'district-1',
              name: 'Phú Quốc',
              provinceId: 'province-1',
              wards: [{ id: 'ward-1', name: 'Dương Đông', districtId: 'district-1' }],
            },
          ],
        },
      ];
      prismaMock.addressProvince.findMany.mockResolvedValue(mockTree);

      const result = await service.getTree();
      expect(result).toEqual(mockTree);
      expect(prismaMock.addressProvince.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            districts: expect.objectContaining({
              include: expect.objectContaining({
                wards: expect.objectContaining({ orderBy: { name: 'asc' } }),
              }),
            }),
          }),
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('getAllWards', () => {
    it('should return all wards ordered by name', async () => {
      const mockWards = [
        { id: '1', name: 'Dương Đông', slug: 'duong-dong' },
      ];
      prismaMock.addressWard.findMany.mockResolvedValue(mockWards);

      const result = await service.getAllWards();
      expect(result).toEqual(mockWards);
      expect(prismaMock.addressWard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('getFullAddress', () => {
    it('should return full address with district and province', async () => {
      const mockWard = {
        id: '1',
        name: 'Dương Đông',
        district: {
          name: 'Phú Quốc',
          province: { name: 'Kiên Giang' },
        },
      };
      prismaMock.addressWard.findUnique.mockResolvedValue(mockWard);

      const result = await service.getFullAddress('ward1');
      expect(result).toEqual(mockWard);
    });

    it('should return null when ward not found', async () => {
      prismaMock.addressWard.findUnique.mockResolvedValue(null);

      const result = await service.getFullAddress('nonexistent');
      expect(result).toBeNull();
    });
  });
});
