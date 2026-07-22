import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriteContractService } from '../shared/contracts/audit.contract';
import { JobContractService } from '../shared/contracts/job.contract';
import { CompanyContractService } from '../shared/contracts/company.contract';
import { ApplicationMessageSenderRole, ApplicationStatus, NotificationType } from '@prisma/client';
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dto/application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';
import { ApplicationEventsPublisher } from './infrastructure/application-events.publisher';
import { QuotaService } from '../../common/quota/quota.service';
import { CacheService } from '../../common/cache/cache.service';
import { RealtimeService } from '../../realtime/realtime.service';

const APPLICATION_MESSAGE_LIMIT = 100;
const APPLICATION_MESSAGE_MAX_LENGTH = 2000;
const CHAT_PRESENCE_TTL_SECONDS = 15;

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditWriteContract: AuditWriteContractService,
    private readonly jobContract: JobContractService,
    private readonly companyContract: CompanyContractService,
    private readonly eventsPublisher: ApplicationEventsPublisher,
    private readonly quotaService: QuotaService,
    private readonly cache?: CacheService,
    private readonly realtime?: RealtimeService,
  ) {}

  async apply(userId: string, data: CreateApplicationDto) {
    // Verify job exists via contract
    const job = await this.jobContract.findById(data.jobId);
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'ACTIVE') throw new ConflictException('Job is not active');
    if (job.archivedAt) throw new ConflictException('Job is archived');
    if (job.deadline && job.deadline.getTime() < Date.now()) throw new ConflictException('Job has expired');
    if (data.cvUrl) this.assertAllowedUploadedCvUrl(data.cvUrl);

    const existing = await this.prisma.jobApplication.findUnique({ where: { userId_jobId: { userId, jobId: data.jobId } } });
    if (existing) throw new ConflictException('Already applied to this job');

    const usedApplications = await this.prisma.jobApplication.count({ where: { userId, candidateDeletedAt: null } });
    await this.quotaService.assertWithinForUser(userId, 'candidateApplications', usedApplications);

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
        where: { userId, candidateDeletedAt: null }, skip: (page - 1) * limit, take: limit,
        include: {
          messages: {
            where: { hiddenForCandidate: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, body: true, senderId: true, senderRole: true, createdAt: true, readAt: true },
          },
          job: { include: { company: { select: { name: true, logo: true } }, ward: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobApplication.count({ where: { userId, candidateDeletedAt: null } }),
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
        where: { job: { company: { ownerId: employerId } }, employerDeletedAt: null },
        skip: (page - 1) * limit, take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          job: { select: { id: true, title: true, company: { select: { name: true } } } },
          resume: {
            select: {
              id: true,
              title: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              address: true,
              degree: true,
              skills: true,
              languages: true,
              socialLinks: true,
              education: true,
              experience: true,
              projects: true,
            },
          },
          messages: {
            where: { hiddenForEmployer: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, body: true, senderId: true, senderRole: true, createdAt: true, readAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobApplication.count({ where: { job: { company: { ownerId: employerId } }, employerDeletedAt: null } }),
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
        where: { jobId, employerDeletedAt: null }, skip: (page - 1) * limit, take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          resume: {
            select: {
              id: true,
              title: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              address: true,
              degree: true,
              skills: true,
              languages: true,
              socialLinks: true,
              education: true,
              experience: true,
              projects: true,
            },
          },
          messages: {
            where: { hiddenForEmployer: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, body: true, senderId: true, senderRole: true, createdAt: true, readAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobApplication.count({ where: { jobId, employerDeletedAt: null } }),
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

  async getJobHistoryForApplication(applicationId: string, userId: string) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            category: true,
            company: true,
            ward: { include: { district: { include: { province: true } } } },
            _count: { select: { applications: true } },
          },
        },
      },
    });

    if (!app) throw new NotFoundException('Application not found');
    if (app.userId === userId || app.job.company.ownerId === userId) {
      return { data: app.job };
    }
    throw new ForbiddenException('Bạn không có quyền xem lịch sử tin tuyển dụng này.');
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

  async updateStatus(id: string, userId: string, status: UpdateApplicationStatusDto['status'], employerMessage?: string) {
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
    const now = new Date();
    const updated = await this.prisma.jobApplication.update({
      where: { id },
      data: {
        status: status as ApplicationStatus,
        employerMessage: employerMessage?.trim() || null,
        statusChangedAt: now,
        ...(status === 'REJECTED'
          ? {
              chatClosedAt: now,
              chatClosedBy: userId,
              chatCloseReason: 'REJECTED',
            }
          : {}),
      },
    });

    const messageBody = employerMessage?.trim();
    if (messageBody) {
      await this.createApplicationMessage({
        applicationId: id,
        userId,
        body: messageBody,
        expectedRole: ApplicationMessageSenderRole.EMPLOYER,
        notifyRecipient: false,
      });
    }

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
    if (app.candidateDeletedAt) return app;

    await this.prisma.jobApplication.update({
      where: { id },
      data: { candidateDeletedAt: new Date() },
    });
    return { message: 'Đã xoá đơn ứng tuyển khỏi danh sách của bạn' };
  }

  async removeForEmployer(id: string, userId: string) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id }, include: { job: { include: { company: true } } } });
    if (!app) throw new NotFoundException('Application not found');
    if (app.job.company.ownerId !== userId) throw new ForbiddenException('Not company owner');
    if (app.employerDeletedAt) return app;

    await this.prisma.jobApplication.update({
      where: { id },
      data: { employerDeletedAt: new Date() },
    });
    return { message: 'Đã xoá đơn ứng tuyển khỏi danh sách nhà tuyển dụng' };
  }

  async findMessages(applicationId: string, userId: string) {
    const { role } = await this.resolveApplicationChatAccess(applicationId, userId);
    await this.refreshChatPresence(applicationId, userId);
    const hiddenField = role === ApplicationMessageSenderRole.CANDIDATE ? 'hiddenForCandidate' : 'hiddenForEmployer';

    const messages = await this.prisma.applicationMessage.findMany({
      where: { applicationId, [hiddenField]: false },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });

    return {
      items: messages,
      total: messages.length,
      usage: this.getApplicationMessageUsage(messages.length),
    };
  }

  async sendMessage(applicationId: string, userId: string, body: string) {
    return this.createApplicationMessage({ applicationId, userId, body });
  }

  async closeChat(applicationId: string, userId: string) {
    const { application, role } = await this.resolveApplicationChatAccess(applicationId, userId);
    if (role !== ApplicationMessageSenderRole.EMPLOYER) {
      throw new ForbiddenException('Chỉ nhà tuyển dụng được đóng cuộc trò chuyện.');
    }

    if (application.chatClosedAt) return application;

    const updated = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        chatClosedAt: new Date(),
        chatClosedBy: userId,
        chatCloseReason: 'EMPLOYER_ARCHIVED',
      },
    });

    await this.auditWriteContract.log({
      action: 'application.chat.closed',
      entityType: 'Application',
      entityId: applicationId,
      actorId: userId,
      metadata: { reason: 'EMPLOYER_ARCHIVED' },
    });

    return updated;
  }

  async markMessagesRead(applicationId: string, userId: string) {
    const { role } = await this.resolveApplicationChatAccess(applicationId, userId);
    await this.refreshChatPresence(applicationId, userId);
    const result = await this.prisma.applicationMessage.updateMany({
      where: {
        applicationId,
        senderId: { not: userId },
        readAt: null,
        ...(role === ApplicationMessageSenderRole.CANDIDATE
          ? { hiddenForCandidate: false }
          : { hiddenForEmployer: false }),
      },
      data: { readAt: new Date() },
    });
    this.realtime?.emitApplicationMessagesRead(applicationId, {
      readerId: userId,
      readAt: new Date(),
    });
    return { updated: result.count };
  }

  private async createApplicationMessage(input: {
    applicationId: string;
    userId: string;
    body: string;
    expectedRole?: ApplicationMessageSenderRole;
    notifyRecipient?: boolean;
  }) {
    const messageBody = input.body.trim();
    if (!messageBody) throw new BadRequestException('Nội dung tin nhắn không được để trống.');
    if (messageBody.length > APPLICATION_MESSAGE_MAX_LENGTH) {
      throw new BadRequestException(`Tin nhắn tối đa ${APPLICATION_MESSAGE_MAX_LENGTH} ký tự.`);
    }

    const { application, role } = await this.resolveApplicationChatAccess(input.applicationId, input.userId);
    if (input.expectedRole && role !== input.expectedRole) {
      throw new ForbiddenException('Bạn không có quyền gửi loại tin nhắn này.');
    }

    if (!input.expectedRole) {
      this.assertApplicationChatCanSend(application);
    }

    const count = await this.prisma.applicationMessage.count({ where: { applicationId: input.applicationId } });
    if (count >= APPLICATION_MESSAGE_LIMIT) {
      throw new UnprocessableEntityException({
        code: 'QUOTA_EXCEEDED',
        message: 'Cuộc trò chuyện đã đạt giới hạn tin nhắn.',
        resource: 'applicationMessages',
        limit: APPLICATION_MESSAGE_LIMIT,
        used: count,
        remaining: 0,
      });
    }

    const message = await this.prisma.applicationMessage.create({
      data: {
        applicationId: input.applicationId,
        senderId: input.userId,
        senderRole: role,
        body: messageBody,
      },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });
    this.realtime?.emitApplicationMessage(input.applicationId, message);

    const recipientId =
      role === ApplicationMessageSenderRole.CANDIDATE
        ? application.job.company.ownerId
        : application.userId;

    const shouldNotify =
      input.notifyRecipient !== false &&
      recipientId &&
      recipientId !== input.userId &&
      !(await this.isChatOpen(input.applicationId, recipientId));

    if (shouldNotify) {
      const notification = await this.prisma.notification.upsert({
        where: {
          userId_dedupeKey: {
            userId: recipientId,
            dedupeKey: `application.message:${input.applicationId}:${message.id}:${recipientId}`,
          },
        },
        update: {},
        create: {
          userId: recipientId,
          type: NotificationType.SYSTEM,
          title: 'Bạn có tin nhắn tuyển dụng mới',
          content:
            role === ApplicationMessageSenderRole.CANDIDATE
              ? `${application.user?.name || 'Ứng viên'} đã gửi tin nhắn về vị trí ${application.job.title}.`
              : `${application.job.company.name} đã gửi tin nhắn về vị trí ${application.job.title}.`,
          refType: 'application',
          refId: input.applicationId,
          dedupeKey: `application.message:${input.applicationId}:${message.id}:${recipientId}`,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      });
      if (this.realtime) {
        const unread = await this.prisma.notification.count({ where: { userId: recipientId, isRead: false } });
        this.realtime.emitNotificationCreated(recipientId, notification);
        this.realtime.emitUnreadCountChanged(recipientId, unread);
        this.realtime.emitDashboardInvalidate(recipientId, role === ApplicationMessageSenderRole.CANDIDATE ? 'employer' : 'candidate', 'application-message');
      }
    }

    return message;
  }

  private chatPresenceKey(applicationId: string, userId: string) {
    return `application-chat:open:${applicationId}:${userId}`;
  }

  private getApplicationMessageUsage(used: number) {
    return {
      used,
      limit: APPLICATION_MESSAGE_LIMIT,
      remaining: Math.max(0, APPLICATION_MESSAGE_LIMIT - used),
      maxLength: APPLICATION_MESSAGE_MAX_LENGTH,
    };
  }

  private async refreshChatPresence(applicationId: string, userId: string) {
    if (!this.cache) return;
    await this.cache.set(this.chatPresenceKey(applicationId, userId), true, CHAT_PRESENCE_TTL_SECONDS);
  }

  private async isChatOpen(applicationId: string, userId: string) {
    if (!this.cache) return false;
    return this.cache.has(this.chatPresenceKey(applicationId, userId));
  }

  private assertApplicationChatCanSend(application: {
    status: ApplicationStatus;
    chatClosedAt?: Date | null;
  }) {
    if (application.chatClosedAt) {
      throw new BadRequestException('Cuộc trò chuyện đã đóng.');
    }
    if (application.status === ApplicationStatus.REJECTED) {
      throw new BadRequestException('Hồ sơ đã bị từ chối, cuộc trò chuyện chỉ còn chế độ xem.');
    }
    if (application.status !== ApplicationStatus.ACCEPTED) {
      throw new BadRequestException('Chỉ có thể nhắn tin sau khi hồ sơ được chấp nhận.');
    }
  }

  private async resolveApplicationChatAccess(applicationId: string, userId: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: { select: { id: true, name: true } },
        job: { include: { company: { select: { id: true, name: true, ownerId: true } } } },
      },
    });

    if (!application) throw new NotFoundException('Application not found');
    if (application.userId === userId) {
      return { application, role: ApplicationMessageSenderRole.CANDIDATE };
    }
    if (application.job.company.ownerId === userId) {
      return { application, role: ApplicationMessageSenderRole.EMPLOYER };
    }
    throw new ForbiddenException('Bạn không có quyền truy cập cuộc trò chuyện này.');
  }

}
