import { Injectable, UnauthorizedException } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth';
import type { RealtimeUser } from './realtime.types';

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getUserFromCookie(cookieHeader?: string): Promise<RealtimeUser> {
    if (!cookieHeader) throw new UnauthorizedException('Missing session cookie');

    const session = await auth.api.getSession({
      headers: fromNodeHeaders({ cookie: cookieHeader }),
    });
    if (!session?.user?.id) throw new UnauthorizedException('Invalid session');

    const user = await this.prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true, isActive: true, isLocked: true },
    });
    if (!user || user.isActive === false || user.isLocked === true) {
      throw new UnauthorizedException('Invalid user');
    }

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async canAccessApplication(applicationId: string, userId: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      select: {
        userId: true,
        job: { select: { company: { select: { ownerId: true } } } },
      },
    });
    if (!application) return false;
    return application.userId === userId || application.job.company.ownerId === userId;
  }
}
