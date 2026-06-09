import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PinoLoggerService } from '../../common/logger/pino-logger.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLoggerService,
  ) {}

  async log(data: {
    action: string;
    entityType?: string;
    entityId?: string;
    actorId?: string;
    oldValue?: string;
    newValue?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const log = await this.prisma.auditLog.create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          actorId: data.actorId,
          oldValue: data.oldValue,
          newValue: data.newValue,
          metadata: data.metadata || {},
        },
      });
      this.logger.debug(`Audit log: ${data.action} (${data.entityType}/${data.entityId})`, 'AuditService');
      return log;
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`, undefined, 'AuditService');
      throw error;
    }
  }

  async findAll(query: {
    action?: string;
    entityType?: string;
    entityId?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const { action, entityType, entityId, actorId, from, to, page = 1, limit = 20 } = query;
    const where: Prisma.AuditLogWhereInput = {};

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (actorId) where.actorId = actorId;

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }
}
