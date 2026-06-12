import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface AuditLogInput {
  action: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditWriteContractService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLogInput) {
    return this.prisma.auditLog.create({
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
  }
}
