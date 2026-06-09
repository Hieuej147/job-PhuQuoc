import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: { page?: number; limit?: number; role?: string; search?: string }) {
    const { role, search } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const where: Prisma.userWhereInput = {};

    if (role) where.role = role as Role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, isLocked: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, phone: true, image: true, isActive: true, isLocked: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: { name?: string; phone?: string; image?: string }) {
    const oldUser = await this.findById(id);
    const updated = await this.prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true, phone: true, image: true } });

    await this.auditService.log({
      action: 'user.updated',
      entityType: 'User',
      entityId: id,
      actorId: id,
      oldValue: JSON.stringify({ name: oldUser.name, phone: oldUser.phone, image: oldUser.image }),
      newValue: JSON.stringify(data),
    });

    return updated;
  }

  async toggleActive(id: string) {
    const user = await this.findById(id);
    const updated = await this.prisma.user.update({ where: { id }, data: { isActive: !user.isActive }, select: { id: true, name: true, email: true, isActive: true } });

    await this.auditService.log({
      action: 'user.active.toggled',
      entityType: 'User',
      entityId: id,
      actorId: id,
      oldValue: JSON.stringify({ isActive: user.isActive }),
      newValue: JSON.stringify({ isActive: updated.isActive }),
    });

    return updated;
  }

  async toggleLock(id: string) {
    const user = await this.findById(id);
    const updated = await this.prisma.user.update({ where: { id }, data: { isLocked: !user.isLocked }, select: { id: true, name: true, email: true, isLocked: true } });

    await this.auditService.log({
      action: 'user.locked.toggled',
      entityType: 'User',
      entityId: id,
      actorId: id,
      oldValue: JSON.stringify({ isLocked: user.isLocked }),
      newValue: JSON.stringify({ isLocked: updated.isLocked }),
    });

    return updated;
  }

  async remove(id: string) {
    const user = await this.findById(id);
    await this.prisma.user.delete({ where: { id } });

    await this.auditService.log({
      action: 'user.deleted',
      entityType: 'User',
      entityId: id,
      actorId: id,
      metadata: { deletedUser: { name: user.name, email: user.email, role: user.role } },
    });

    return { message: 'User deleted' };
  }
}
