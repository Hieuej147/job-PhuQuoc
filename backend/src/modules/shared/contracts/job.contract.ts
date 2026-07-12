import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JobStatus } from '@prisma/client';

export interface JobContract {
  id: string;
  title: string;
  status: string;
  companyId: string;
  salaryMin: number | null;
  salaryMax: number | null;
  deadline: Date | null;
  archivedAt: Date | null;
}

@Injectable()
export class JobContractService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<JobContract | null> {
    return this.prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        companyId: true,
        salaryMin: true,
        salaryMax: true,
        deadline: true,
        archivedAt: true,
      },
    });
  }

  async findByCompanyId(companyId: string): Promise<JobContract[]> {
    return this.prisma.job.findMany({
      where: { companyId },
      select: {
        id: true,
        title: true,
        status: true,
        companyId: true,
        salaryMin: true,
        salaryMax: true,
        deadline: true,
        archivedAt: true,
      },
    });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.prisma.job.update({
      where: { id },
      data: { status: status as JobStatus },
    });
  }

  async activateJob(
    id: string,
    activation: {
      deadline: Date;
      durationDays: number;
      boostLevel: number;
      featuredUntil?: Date | null;
      paymentId: string;
      activationId?: string | null;
    },
  ): Promise<void> {
    await this.prisma.job.update({
      where: { id },
      data: {
        status: 'ACTIVE' as JobStatus,
        deadline: activation.deadline,
        publishedAt: new Date(),
        closedAt: null,
        closeReason: null,
        durationDays: activation.durationDays,
        boostLevel: activation.boostLevel,
        featuredUntil: activation.featuredUntil,
        currentPaymentId: activation.paymentId,
        activationId: activation.activationId,
      },
    });
  }

  async countByCategoryId(categoryId: string): Promise<number> {
    return this.prisma.job.count({ where: { categoryId } });
  }
}
