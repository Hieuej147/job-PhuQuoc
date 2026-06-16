import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InngestService } from '../../inngest/inngest.service';
import { AuditWriteContractService } from '../shared/contracts/audit.contract';
import { JobContractService } from '../shared/contracts/job.contract';
import { CompanyContractService } from '../shared/contracts/company.contract';
import { ApplicationStatus } from '@prisma/client';
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dto/application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inngest: InngestService,
    private readonly auditWriteContract: AuditWriteContractService,
    private readonly jobContract: JobContractService,
    private readonly companyContract: CompanyContractService,
  ) {}

  async apply(userId: string, data: CreateApplicationDto) {
    // Verify job exists via contract
    const job = await this.jobContract.findById(data.jobId);
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'ACTIVE') throw new ConflictException('Job is not active');

    const existing = await this.prisma.jobApplication.findUnique({ where: { userId_jobId: { userId, jobId: data.jobId } } });
    if (existing) throw new ConflictException('Already applied to this job');

    const application = await this.prisma.jobApplication.create({
      data: { ...data, userId },
      include: { job: { include: { company: true } } },
    });

    await this.inngest.send({
      name: 'application.created',
      data: {
        applicationId: application.id,
        jobTitle: application.job.title,
        companyName: application.job.company.name,
        employerId: application.job.company.ownerId,
      },
    });

    await this.auditWriteContract.log({
      action: 'application.created',
      entityType: 'Application',
      entityId: application.id,
      actorId: userId,
      metadata: { jobId: data.jobId },
    });

    return application;
  }

  async findByUser(userId: string, query: ApplicationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const [items, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where: { userId }, skip: (page - 1) * limit, take: limit,
        include: { job: { include: { company: { select: { name: true, logo: true } }, ward: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobApplication.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByEmployer(employerId: string, query: ApplicationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const [items, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where: { job: { company: { ownerId: employerId } } },
        skip: (page - 1) * limit, take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          job: { select: { id: true, title: true, company: { select: { name: true } } } },
          resume: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobApplication.count({ where: { job: { company: { ownerId: employerId } } } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByJob(jobId: string, userId: string, query: ApplicationQueryDto) {
    // Verify job ownership via contract
    const job = await this.jobContract.findById(jobId);
    if (!job) throw new NotFoundException('Job not found');

    const company = await this.companyContract.findByOwnerId(userId);
    if (!company || company.id !== job.companyId) throw new ForbiddenException('Not company owner');

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const [items, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where: { jobId }, skip: (page - 1) * limit, take: limit,
        include: { user: { select: { id: true, name: true, email: true, phone: true } }, resume: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobApplication.count({ where: { jobId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, userId: string, status: UpdateApplicationStatusDto['status']) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: { job: { include: { company: true } }, user: true },
    });
    if (!app) throw new NotFoundException('Application not found');
    if (app.job.company.ownerId !== userId) throw new ForbiddenException('Not company owner');

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: ['REVIEWING', 'ACCEPTED', 'REJECTED'],
      REVIEWING: ['ACCEPTED', 'REJECTED'],
      ACCEPTED: [], // terminal
      REJECTED: [], // terminal
    };
    const allowed = validTransitions[app.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot change status from ${app.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`);
    }

    const oldStatus = app.status;
    const updated = await this.prisma.jobApplication.update({ where: { id }, data: { status: status as ApplicationStatus } });

    if (status === 'ACCEPTED') {
      await this.inngest.send({
        name: 'application.accepted',
        data: {
          applicationId: id,
          jobTitle: app.job.title,
          companyName: app.job.company.name,
          candidateId: app.userId,
        },
      });
    } else if (status === 'REJECTED') {
      await this.inngest.send({
        name: 'application.rejected',
        data: {
          applicationId: id,
          jobTitle: app.job.title,
          companyName: app.job.company.name,
          candidateId: app.userId,
        },
      });
    }

    await this.auditWriteContract.log({
      action: 'application.status.changed',
      entityType: 'Application',
      entityId: id,
      actorId: userId,
      oldValue: oldStatus,
      newValue: status,
    });

    return updated;
  }

  async toggleBookmark(id: string, userId: string) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id }, include: { job: { include: { company: true } } } });
    if (!app) throw new NotFoundException('Application not found');
    if (app.job.company.ownerId !== userId) throw new ForbiddenException('Not company owner');
    return this.prisma.jobApplication.update({ where: { id }, data: { isBookmarked: !app.isBookmarked } });
  }

  async remove(id: string, userId: string) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    if (app.userId !== userId) throw new ForbiddenException('Not your application');
    await this.prisma.jobApplication.delete({ where: { id } });
    return { message: 'Application withdrawn' };
  }
}
