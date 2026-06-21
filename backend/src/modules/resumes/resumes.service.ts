import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PinoLoggerService } from '../../common/logger/pino-logger.service';
import { TemplateValidatorService } from './template-validator.service';
import { TemplateEngineService, ResumeData } from './template-engine.service';
import { UserContractService } from '../shared/contracts/user.contract';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLoggerService,
    private readonly templateValidator: TemplateValidatorService,
    private readonly templateEngine: TemplateEngineService,
    private readonly userContract: UserContractService,
  ) {}

  // ===== Resume CRUD =====

  async findByUser(userId: string) {
    return this.prisma.candidateResume.findMany({
      where: { userId },
      include: { template: { select: { id: true, name: true, previewUrl: true, isPublic: true } } },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async findById(id: string, userId?: string) {
    const resume = await this.prisma.candidateResume.findUnique({
      where: { id },
      include: {
        template: { select: { id: true, name: true, description: true, previewUrl: true, htmlTemplate: true, cssTemplate: true, isPublic: true } },
        user: { select: { id: true, name: true, email: true, phone: true, image: true } }
      },
    });
    if (!resume) throw new NotFoundException('Resume not found');
    if (userId && resume.userId !== userId) throw new ForbiddenException('Not your resume');
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
    htmlTemplate: string;
    cssTemplate: string;
    isPublic?: boolean;
  }) {
    // Validate HTML/CSS
    const validation = this.templateValidator.validate(data.htmlTemplate, data.cssTemplate);
    if (!validation.valid) {
      throw new BadRequestException(`Template không hợp lệ: ${validation.errors.join(', ')}`);
    }

    return this.prisma.resumeTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        htmlTemplate: validation.sanitizedHtml,
        cssTemplate: validation.sanitizedCss,
        isPublic: data.isPublic || false,
        userId: userId,
      },
    });
  }

  async updateTemplate(id: string, userId: string, data: {
    name?: string;
    description?: string;
    htmlTemplate?: string;
    cssTemplate?: string;
    isPublic?: boolean;
    isActive?: boolean;
  }) {
    const template = await this.prisma.resumeTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    
    // Only owner can update
    if (template.userId && template.userId !== userId) {
      throw new ForbiddenException('Not your template');
    }

    // Validate if HTML/CSS provided
    if (data.htmlTemplate || data.cssTemplate) {
      const html = data.htmlTemplate || template.htmlTemplate;
      const css = data.cssTemplate || template.cssTemplate;
      const validation = this.templateValidator.validate(html, css);
      if (!validation.valid) {
        throw new BadRequestException(`Template không hợp lệ: ${validation.errors.join(', ')}`);
      }
      data.htmlTemplate = validation.sanitizedHtml;
      data.cssTemplate = validation.sanitizedCss;
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

  // ===== Render =====

  async render(id: string, userId?: string, mode: 'view' | 'edit' = 'view') {
    const resume = await this.prisma.candidateResume.findUnique({
      where: { id },
      include: { template: true },
    });
    if (!resume) throw new NotFoundException('Resume not found');
    if (userId && resume.userId !== userId) throw new ForbiddenException('Not your resume');

    const user = await this.userContract.findById(resume.userId);

    const resumeData: ResumeData = {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      avatar: user?.image || '',
      address: resume.address || '',
      degree: resume.degree || '',
      summary: resume.summary || '',
      skills: resume.skills || '',
      languages: resume.languages || '',
      socialLinks: (resume.socialLinks as any[]) || [],
      education: (resume.education as any[]) || [],
      experience: (resume.experience as any[]) || [],
      projects: (resume.projects as any[]) || [],
    };

    const html = mode === 'edit'
      ? this.templateEngine.renderForEdit(resume.template.htmlTemplate, resume.template.cssTemplate, resumeData)
      : this.templateEngine.renderForView(resume.template.htmlTemplate, resume.template.cssTemplate, resumeData);

    return {
      html,
      resume: {
        id: resume.id,
        title: resume.title,
        templateId: resume.templateId,
      },
      template: {
        id: resume.template.id,
        name: resume.template.name,
      },
    };
  }

  async renderTemplate(templateId: string, data: ResumeData, mode: 'view' | 'edit' = 'view') {
    const template = await this.prisma.resumeTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Template not found');

    const html = mode === 'edit'
      ? this.templateEngine.renderForEdit(template.htmlTemplate, template.cssTemplate, data)
      : this.templateEngine.renderForView(template.htmlTemplate, template.cssTemplate, data);

    return {
      html,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
      },
    };
  }

  async generatePdf(id: string, userId?: string): Promise<Buffer> {
    const resume = await this.prisma.candidateResume.findUnique({
      where: { id },
      include: { template: { select: { id: true } } },
    });
    if (!resume) throw new NotFoundException('Resume not found');
    if (userId && resume.userId !== userId) throw new ForbiddenException('Not your resume');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const printUrl = `${frontendUrl}/candidate/resumes/${id}/print`;

    let puppeteer: typeof import('puppeteer');
    try {
      puppeteer = await import('puppeteer');
    } catch {
      throw new Error('Puppeteer is not installed. Run: pnpm add puppeteer');
    }

    let browser;
    try {
      browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for template to render
      await page.waitForSelector('[class*="cv"], [class*="resume"], [class*="template"]', { timeout: 10000 }).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });

      return Buffer.from(pdf);
    } finally {
      if (browser) await browser.close();
    }
  }
}
