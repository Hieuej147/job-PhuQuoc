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

  describe('getProvinces', () => {
    it('should return all provinces ordered by name', async () => {
      const mockProvinces = [
        { id: '1', name: 'Kiên Giang', slug: 'kien-giang' },
      ];
      prismaMock.addressProvince.findMany.mockResolvedValue(mockProvinces);

      const result = await service.getProvinces();
      expect(result).toEqual(mockProvinces);
      expect(prismaMock.addressProvince.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('getDistricts', () => {
    it('should return districts for province', async () => {
      const mockDistricts = [
        { id: '1', name: 'Phú Quốc', slug: 'phu-quoc' },
      ];
      prismaMock.addressDistrict.findMany.mockResolvedValue(mockDistricts);

      const result = await service.getDistricts('province1');
      expect(result).toEqual(mockDistricts);
      expect(prismaMock.addressDistrict.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { provinceId: 'province1' },
        }),
      );
    });
  });

  describe('getWards', () => {
    it('should return wards for district', async () => {
      const mockWards = [
        { id: '1', name: 'Dương Đông', slug: 'duong-dong' },
      ];
      prismaMock.addressWard.findMany.mockResolvedValue(mockWards);

      const result = await service.getWards('district1');
      expect(result).toEqual(mockWards);
      expect(prismaMock.addressWard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { districtId: 'district1' },
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
