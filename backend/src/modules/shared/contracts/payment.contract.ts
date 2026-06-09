import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface PaymentContract {
  id: string;
  userId: string;
  jobId: string;
  packageId: string;
  amount: number;
  status: string;
}

@Injectable()
export class PaymentContractService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PaymentContract | null> {
    return this.prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        jobId: true,
        packageId: true,
        amount: true,
        status: true,
      },
    });
  }

  async findByJobId(jobId: string): Promise<PaymentContract | null> {
    return this.prisma.payment.findFirst({
      where: { jobId },
      select: {
        id: true,
        userId: true,
        jobId: true,
        packageId: true,
        amount: true,
        status: true,
      },
    });
  }

  async countByPackageId(packageId: string): Promise<number> {
    return this.prisma.payment.count({
      where: { packageId },
    });
  }
}
