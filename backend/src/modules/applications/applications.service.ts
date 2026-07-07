import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriteContractService } from '../shared/contracts/audit.contract';
import { JobContractService } from '../shared/contracts/job.contract';
import { CompanyContractService } from '../shared/contracts/company.contract';
import { ApplicationStatus } from '@prisma/client';
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dto/application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';
import { ApplicationEventsPublisher } from './infrastructure/application-events.publisher';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditWriteContract: AuditWriteContractService,
    private readonly jobContract: JobContractService,
    private readonly companyContract: CompanyContractService,
    private readonly eventsPublisher: ApplicationEventsPublisher,
  ) {}

  async apply(userId: string, data: CreateApplicationDto) {
    // Verify job exists via contract
    const job = await this.jobContract.findById(data.jobId);
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'ACTIVE') throw new ConflictException('Job is not active');
    if (data.cvUrl) this.assertAllowedUploadedCvUrl(data.cvUrl);

    const existing = await this.prisma.jobApplication.findUnique({ where: { userId_jobId: { userId, jobId: data.jobId } } });
    if (existing) throw new ConflictException('Already applied to this job');

    const application = await this.prisma.jobApplication.create({
      data: { ...data, userId },
      include: { job: { include: { company: true } } },
    });

    this.eventsPublisher.applicationCreated({
      applicationId: application.id,
      jobTitle: application.job.title,
      companyName: application.job.company.name,
      employerId: application.job.company.ownerId,
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

  async checkApplied(userId: string, jobId: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { userId_jobId: { userId, jobId } },
      select: { id: true, status: true },
    });

    return {
      applied: Boolean(application),
      applicationId: application?.id ?? null,
      status: application?.status ?? null,
    };
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
          resume: { select: { id: true, title: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobApplication.count({ where: { job: { company: { ownerId: employerId } } } }),
    ]);
    return { data: { items, total, page, limit, totalPages: Math.ceil(total / limit) } };
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
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          resume: { select: { id: true, title: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobApplication.count({ where: { jobId } }),
    ]);
    return { data: { items, total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getResumeForEmployer(applicationId: string, employerId: string) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: { include: { company: true } },
        resume: {
          include: {
            template: { select: { id: true, name: true, description: true, previewUrl: true, isPublic: true } },
            user: { select: { id: true, name: true, email: true, phone: true, image: true } },
          },
        },
      },
    });

    if (!app) throw new NotFoundException('Application not found');
    if (app.job.company.ownerId !== employerId) throw new ForbiddenException('Not company owner');

    if (app.cvUrl) {
      this.assertAllowedUploadedCvUrl(app.cvUrl);
      return { data: { type: 'uploaded', url: app.cvUrl } };
    }

    if (app.resume) {
      return { data: { type: 'resume', resume: app.resume } };
    }

    throw new NotFoundException('No CV found for this application');
  }

  async getUploadedCvUrlForEmployer(applicationId: string, employerId: string) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { job: { include: { company: true } } },
    });

    if (!app) throw new NotFoundException('Application not found');
    if (app.job.company.ownerId !== employerId) throw new ForbiddenException('Not company owner');
    if (!app.cvUrl) throw new NotFoundException('No uploaded CV found for this application');

    this.assertAllowedUploadedCvUrl(app.cvUrl);
    return { url: app.cvUrl };
  }

  private assertAllowedUploadedCvUrl(url: string) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('CV upload URL không hợp lệ');
    }

    const isCloudinaryCandidateCv =
      parsed.protocol === 'https:' &&
      parsed.hostname === 'res.cloudinary.com' &&
      (parsed.pathname.includes('/image/upload/') || parsed.pathname.includes('/raw/upload/')) &&
      parsed.pathname.includes('/job-phuquoc/candidate-cvs/');

    if (!isCloudinaryCandidateCv) {
      throw new BadRequestException('CV upload URL không thuộc storage hợp lệ của hệ thống');
    }
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
      this.eventsPublisher.applicationAccepted({
        applicationId: id,
        jobTitle: app.job.title,
        companyName: app.job.company.name,
        candidateId: app.userId,
      });
    } else if (status === 'REJECTED') {
      this.eventsPublisher.applicationRejected({
        applicationId: id,
        jobTitle: app.job.title,
        companyName: app.job.company.name,
        candidateId: app.userId,
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
