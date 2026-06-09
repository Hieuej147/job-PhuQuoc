import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class AddressService {
  private readonly CACHE_PREFIX = 'address';
  private readonly CACHE_TTL = 86400; // 24 hours (static data)

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getProvinces() {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, 'provinces');
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const provinces = await this.prisma.addressProvince.findMany({ orderBy: { name: 'asc' } });
    await this.cache.set(cacheKey, provinces, this.CACHE_TTL);
    return provinces;
  }

  async getDistricts(provinceId: string) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, 'districts', provinceId);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const districts = await this.prisma.addressDistrict.findMany({ where: { provinceId }, orderBy: { name: 'asc' } });
    await this.cache.set(cacheKey, districts, this.CACHE_TTL);
    return districts;
  }

  async getWards(districtId: string) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, 'wards', districtId);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const wards = await this.prisma.addressWard.findMany({ where: { districtId }, orderBy: { name: 'asc' } });
    await this.cache.set(cacheKey, wards, this.CACHE_TTL);
    return wards;
  }

  async getAllWards() {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, 'wards', 'all');
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const wards = await this.prisma.addressWard.findMany({
      include: { district: { select: { name: true, province: { select: { name: true } } } } },
      orderBy: { name: 'asc' },
    });
    await this.cache.set(cacheKey, wards, this.CACHE_TTL);
    return wards;
  }

  async getFullAddress(wardId: string) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, 'full', wardId);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const address = await this.prisma.addressWard.findUnique({
      where: { id: wardId },
      include: { district: { include: { province: true } } },
    });
    
    if (address) {
      await this.cache.set(cacheKey, address, this.CACHE_TTL);
    }
    return address;
  }
}
