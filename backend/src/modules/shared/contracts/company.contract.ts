import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface CompanyContract {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  isApproved: boolean;
  isActive: boolean;
}

@Injectable()
export class CompanyContractService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CompanyContract | null> {
    return this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        ownerId: true,
        isApproved: true,
        isActive: true,
      },
    });
  }

  async findByOwnerId(ownerId: string): Promise<CompanyContract | null> {
    return this.prisma.company.findUnique({
      where: { ownerId },
      select: {
        id: true,
        name: true,
        slug: true,
        ownerId: true,
        isApproved: true,
        isActive: true,
      },
    });
  }
}
