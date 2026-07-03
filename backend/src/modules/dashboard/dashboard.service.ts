import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getCandidateSummary(userId: string) {
    const [applicationsTotal, applicationsRecent, savedJobsTotal, savedJobsRecent, savedCompaniesTotal, resumesTotal, resumesRecent, unreadCount, notificationsRecent] =
      await Promise.all([
        this.prisma.jobApplication.count({ where: { userId } }),
        this.prisma.jobApplication.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { job: { include: { company: { select: { name: true, logo: true } }, ward: { select: { name: true } } } } },
        }),
        this.prisma.savedJob.count({ where: { userId } }),
        this.prisma.savedJob.findMany({
          where: { userId },
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: { job: { include: { company: { select: { name: true } } } } },
        }),
        this.prisma.savedCompany.count({ where: { userId } }),
        this.prisma.candidateResume.count({ where: { userId } }),
        this.prisma.candidateResume.findMany({
          where: { userId },
          take: 3,
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.notification.count({ where: { userId, isRead: false } }),
        this.prisma.notification.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    return {
      applications: { total: applicationsTotal, recent: applicationsRecent },
      savedJobs: { total: savedJobsTotal, recent: savedJobsRecent },
      savedCompanies: { total: savedCompaniesTotal },
      resumes: { total: resumesTotal, recent: resumesRecent },
      notifications: { unreadCount, recent: notificationsRecent },
    };
  }

  async getEmployerSummary(userId: string) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
      include: { ward: { include: { district: { include: { province: true } } } } },
    });

    const [jobsTotal, jobsActive, jobsPending, jobsDraft, jobsRecent, applicationsTotal, applicationsPending, applicationsRecent, unreadCount, notificationsRecent] =
      await Promise.all([
        this.prisma.job.count({ where: { company: { ownerId: userId } } }),
        this.prisma.job.count({ where: { company: { ownerId: userId }, status: 'ACTIVE' } }),
        this.prisma.job.count({ where: { company: { ownerId: userId }, status: 'PENDING' } }),
        this.prisma.job.count({ where: { company: { ownerId: userId }, status: 'DRAFT' } }),
        this.prisma.job.findMany({
          where: { company: { ownerId: userId } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { applications: true } } },
        }),
        this.prisma.jobApplication.count({ where: { job: { company: { ownerId: userId } } } }),
        this.prisma.jobApplication.count({ where: { job: { company: { ownerId: userId } }, status: 'PENDING' } }),
        this.prisma.jobApplication.findMany({
          where: { job: { company: { ownerId: userId } } },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            job: { select: { id: true, title: true, company: { select: { name: true } } } },
            resume: { select: { id: true, title: true, name: true, email: true, phone: true, skills: true } },
          },
        }),
        this.prisma.notification.count({ where: { userId, isRead: false } }),
        this.prisma.notification.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    return {
      company,
      jobs: { total: jobsTotal, active: jobsActive, pending: jobsPending, draft: jobsDraft, recent: jobsRecent },
      applications: { total: applicationsTotal, pending: applicationsPending, recent: applicationsRecent },
      notifications: { unreadCount, recent: notificationsRecent },
    };
  }
}
