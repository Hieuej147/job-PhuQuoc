import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PinoLoggerService } from '../../common/logger/pino-logger.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLoggerService,
  ) {}

  // ===== Resume CRUD =====

  async findByUser(userId: string) {
    return this.prisma.candidateResume.findMany({
      where: { userId, isProfile: false },
      include: { template: { select: { id: true, name: true, previewUrl: true, isPublic: true } } },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async getProfile(userId: string) {
    let profile = await this.prisma.candidateResume.findFirst({
      where: { userId, isProfile: true },
      include: {
        template: { select: { id: true, name: true, description: true, previewUrl: true, isPublic: true } },
        user: { select: { id: true, name: true, email: true, phone: true, image: true } }
      },
    });

    if (!profile) {
      const defaultTemplate = await this.prisma.resumeTemplate.findFirst({ where: { isActive: true } });
      const templateId = defaultTemplate?.id || 'tpl-minimal-03';
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      profile = await this.prisma.candidateResume.create({
        data: {
          userId,
          templateId,
          isProfile: true,
          title: 'Hồ sơ gốc',
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          avatar: user?.image,
        },
        include: {
          template: { select: { id: true, name: true, description: true, previewUrl: true, isPublic: true } },
          user: { select: { id: true, name: true, email: true, phone: true, image: true } }
        },
      });
    }

    return profile;
  }

  async updateProfile(userId: string, data: Record<string, unknown>) {
    const profile = await this.getProfile(userId);
    const { id: _, userId: __, isProfile: ___, templateId: ____, createdAt: _____, updatedAt: ______, ...updateData } = data;

    const userUpdates: Record<string, any> = {};
    if (typeof updateData.name === 'string') userUpdates.name = updateData.name;
    if (typeof updateData.phone === 'string') userUpdates.phone = updateData.phone;
    if (typeof updateData.avatar === 'string') userUpdates.image = updateData.avatar;
    
    if (Object.keys(userUpdates).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: userUpdates,
      });
    }

    return this.prisma.candidateResume.update({
      where: { id: profile.id },
      data: updateData as Prisma.CandidateResumeUpdateInput,
      include: {
        template: { select: { id: true, name: true, description: true, previewUrl: true, isPublic: true } },
        user: { select: { id: true, name: true, email: true, phone: true, image: true } }
      },
    });
  }

  async findById(id: string, userId?: string, userRole?: string) {
    const resume = await this.prisma.candidateResume.findUnique({
      where: { id },
      include: {
        template: { select: { id: true, name: true, description: true, previewUrl: true, isPublic: true } },
        user: { select: { id: true, name: true, email: true, phone: true, image: true } }
      },
    });
    if (!resume) throw new NotFoundException('Resume not found');
    if (userId && userRole !== 'EMPLOYER' && userRole !== 'ADMIN' && resume.userId !== userId) {
      throw new ForbiddenException('Not your resume');
    }
    return resume;
  }

  async create(userId: string, data: Record<string, unknown>) {
    const templateId = (data.templateId as string) || (await this.prisma.resumeTemplate.findFirst({ where: { isActive: true } }))?.id;
    if (!templateId) throw new NotFoundException('No template found');

    // Verify template exists
    const template = await this.prisma.resumeTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Template not found');

    const isDefault = data.isDefault === true;

    if (isDefault) {
      await this.prisma.candidateResume.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const { templateId: _, isDefault: __, ...resumeData } = data;
    return this.prisma.candidateResume.create({
      data: {
        ...resumeData as Prisma.CandidateResumeUncheckedCreateInput,
        userId,
        templateId,
        isDefault,
      },
    });
  }

  async update(id: string, userId: string, data: Record<string, unknown>) {
    const resume = await this.prisma.candidateResume.findUnique({ where: { id } });
    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.userId !== userId) throw new ForbiddenException('Not your resume');

    if (data.isDefault === true) {
      await this.prisma.candidateResume.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.candidateResume.update({
      where: { id },
      data: data as Prisma.CandidateResumeUpdateInput,
    });
  }

  async remove(id: string, userId: string) {
    const resume = await this.prisma.candidateResume.findUnique({ where: { id } });
    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.userId !== userId) throw new ForbiddenException('Not your resume');
    await this.prisma.candidateResume.delete({ where: { id } });
    return { message: 'Resume deleted' };
  }

  // ===== Template CRUD =====

  async getTemplates(userId?: string, publicOnly: boolean = false) {
    const where: Prisma.ResumeTemplateWhereInput = { isActive: true };
    
    if (publicOnly) {
      where.isPublic = true;
    } else if (userId) {
      // Public templates + user's own templates
      where.OR = [
        { isPublic: true },
        { userId: userId },
      ];
    } else {
      where.isPublic = true;
    }

    return this.prisma.resumeTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        previewUrl: true,
        isPublic: true,
        userId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplateById(id: string) {
    const template = await this.prisma.resumeTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async createTemplate(userId: string, data: {
    name: string;
    description?: string;
    previewUrl?: string;
    isPublic?: boolean;
  }) {
    return this.prisma.resumeTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        previewUrl: data.previewUrl,
        isPublic: data.isPublic || false,
        userId: userId,
      },
    });
  }

  async updateTemplate(id: string, userId: string, data: {
    name?: string;
    description?: string;
    previewUrl?: string;
    isPublic?: boolean;
    isActive?: boolean;
  }) {
    const template = await this.prisma.resumeTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    
    // Only owner can update
    if (template.userId && template.userId !== userId) {
      throw new ForbiddenException('Not your template');
    }

    return this.prisma.resumeTemplate.update({
      where: { id },
      data,
    });
  }

  async removeTemplate(id: string, userId: string) {
    const template = await this.prisma.resumeTemplate.findUnique({
      where: { id },
      include: { _count: { select: { resumes: true } } },
    });
    if (!template) throw new NotFoundException('Template not found');
    
    // Only owner can delete
    if (template.userId && template.userId !== userId) {
      throw new ForbiddenException('Not your template');
    }

    if (template._count.resumes > 0) {
      throw new BadRequestException(`Template đang được sử dụng bởi ${template._count.resumes} CV, không thể xóa`);
    }

    await this.prisma.resumeTemplate.delete({ where: { id } });
    return { message: 'Template deleted' };
  }

}
