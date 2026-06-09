import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface PricingContract {
  id: string;
  name: string;
  days: number;
  price: number;
  isActive: boolean;
}

@Injectable()
export class PricingContractService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PricingContract | null> {
    return this.prisma.pricingPackage.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        days: true,
        price: true,
        isActive: true,
      },
    });
  }

  async findActive(): Promise<PricingContract[]> {
    return this.prisma.pricingPackage.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        days: true,
        price: true,
        isActive: true,
      },
      orderBy: { price: 'asc' },
    });
  }
}
