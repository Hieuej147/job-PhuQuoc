import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { PaymentContractService } from '../shared/contracts/payment.contract';

@Injectable()
export class PricingService {
  private readonly CACHE_PREFIX = 'pricing';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly paymentContract: PaymentContractService,
  ) {}

  async findAll(activeOnly = false) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, 'all', activeOnly ? 'active' : 'all');
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where = activeOnly ? { isActive: true } : {};
    const packages = await this.prisma.pricingPackage.findMany({
      where,
      orderBy: { price: 'asc' },
    });
    
    await this.cache.set(cacheKey, packages, this.CACHE_TTL);
    return packages;
  }

  async findById(id: string) {
    const cacheKey = this.cache.generateKey(this.CACHE_PREFIX, id);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const pkg = await this.prisma.pricingPackage.findUnique({
      where: { id },
    });
    if (!pkg) throw new NotFoundException('Pricing package not found');
    
    await this.cache.set(cacheKey, pkg, this.CACHE_TTL);
    return pkg;
  }

  async create(data: { name: string; days: number; price: number; isActive?: boolean }) {
    const pkg = await this.prisma.pricingPackage.create({
      data: {
        name: data.name,
        days: data.days,
        price: data.price,
        isActive: data.isActive ?? true,
      },
    });
    await this.invalidateCache();
    return pkg;
  }

  async update(id: string, data: { name?: string; days?: number; price?: number; isActive?: boolean }) {
    await this.findById(id);
    const updated = await this.prisma.pricingPackage.update({
      where: { id },
      data,
    });
    await this.invalidateCache();
    return updated;
  }

  async remove(id: string) {
    await this.findById(id);

    // Check if package has payments via contract
    const paymentCount = await this.paymentContract.countByPackageId(id);
    if (paymentCount > 0) {
      throw new NotFoundException('Cannot delete package with existing payments. Deactivate it instead.');
    }

    await this.prisma.pricingPackage.delete({ where: { id } });
    await this.invalidateCache();
    return { message: 'Pricing package deleted' };
  }

  private async invalidateCache() {
    await this.cache.delPattern(`${this.CACHE_PREFIX}:*`);
  }
}
