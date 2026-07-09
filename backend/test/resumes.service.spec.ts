import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResumesService } from '../src/modules/resumes/resumes.service';

describe('ResumesService', () => {
  let service: ResumesService;
  let prismaMock: any;
  let loggerMock: any;

  beforeEach(() => {
    prismaMock = {
      candidateResume: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
        delete: vi.fn(),
      },
      resumeTemplate: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };
    loggerMock = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
    service = new ResumesService(prismaMock as any, loggerMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUser', () => {
    it('should return resumes for user', async () => {
      const mockResumes = [
        { id: '1', title: 'Resume 1', userId: 'user1' },
      ];
      prismaMock.candidateResume.findMany.mockResolvedValue(mockResumes);

      const result = await service.findByUser('user1');
      expect(result).toEqual(mockResumes);
      expect(prismaMock.candidateResume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1', isProfile: false },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return resume when found', async () => {
      const mockResume = { id: '1', title: 'Resume 1' };
      prismaMock.candidateResume.findUnique.mockResolvedValue(mockResume);

      const result = await service.findById('1');
      expect(result).toEqual(mockResume);
    });

    it('should throw NotFoundException when resume not found', async () => {
      prismaMock.candidateResume.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow('Resume not found');
    });
  });

  describe('create', () => {
    it('should create resume with template', async () => {
      const mockTemplate = { id: 'template1', name: 'Default' };
      const mockResume = { id: '1', title: 'My Resume', templateId: 'template1' };
      
      prismaMock.resumeTemplate.findFirst.mockResolvedValue(mockTemplate);
      prismaMock.resumeTemplate.findUnique.mockResolvedValue(mockTemplate);
      prismaMock.candidateResume.count.mockResolvedValue(0);
      prismaMock.candidateResume.create.mockResolvedValue(mockResume);

      const result = await service.create('user1', { title: 'My Resume' });
      expect(result.templateId).toBe('template1');
    });

    it('should use provided templateId', async () => {
      const mockTemplate = { id: 'custom-template', name: 'Custom' };
      const mockResume = { id: '1', title: 'My Resume', templateId: 'custom-template' };
      prismaMock.resumeTemplate.findUnique.mockResolvedValue(mockTemplate);
      prismaMock.candidateResume.count.mockResolvedValue(0);
      prismaMock.candidateResume.create.mockResolvedValue(mockResume);

      const result = await service.create('user1', { title: 'My Resume', templateId: 'custom-template' });
      expect(result.templateId).toBe('custom-template');
    });

    it('should throw NotFoundException when no template found', async () => {
      prismaMock.resumeTemplate.findFirst.mockResolvedValue(null);

      await expect(service.create('user1', { title: 'My Resume' })).rejects.toThrow('No template found');
    });
  });

  describe('update', () => {
    it('should update resume when owner', async () => {
      const mockResume = { id: '1', userId: 'user1' };
      prismaMock.candidateResume.findUnique.mockResolvedValue(mockResume);
      prismaMock.candidateResume.update.mockResolvedValue({ ...mockResume, title: 'Updated' });

      const result = await service.update('1', 'user1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundException when resume not found', async () => {
      prismaMock.candidateResume.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', 'user1', {})).rejects.toThrow('Resume not found');
    });

    it('should throw ForbiddenException when not owner', async () => {
      const mockResume = { id: '1', userId: 'user1' };
      prismaMock.candidateResume.findUnique.mockResolvedValue(mockResume);

      await expect(service.update('1', 'user2', {})).rejects.toThrow('Not your resume');
    });
  });

  describe('remove', () => {
    it('should delete resume when owner', async () => {
      const mockResume = { id: '1', userId: 'user1', isProfile: false, _count: { applications: 0 } };
      prismaMock.candidateResume.findUnique.mockResolvedValue(mockResume);
      prismaMock.candidateResume.delete.mockResolvedValue(mockResume);

      const result = await service.remove('1', 'user1');
      expect(result.message).toBe('Resume deleted');
    });

    it('should throw NotFoundException when resume not found', async () => {
      prismaMock.candidateResume.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'user1')).rejects.toThrow('Resume not found');
    });

    it('should throw ForbiddenException when not owner', async () => {
      const mockResume = { id: '1', userId: 'user1', isProfile: false, _count: { applications: 0 } };
      prismaMock.candidateResume.findUnique.mockResolvedValue(mockResume);

      await expect(service.remove('1', 'user2')).rejects.toThrow('Not your resume');
    });

    it('should reject deleting resume used in applications', async () => {
      const mockResume = { id: '1', userId: 'user1', isProfile: false, _count: { applications: 1 } };
      prismaMock.candidateResume.findUnique.mockResolvedValue(mockResume);

      await expect(service.remove('1', 'user1')).rejects.toThrow('đã dùng để ứng tuyển');
      expect(prismaMock.candidateResume.delete).not.toHaveBeenCalled();
    });
  });

  describe('getTemplates', () => {
    it('should return all templates', async () => {
      const mockTemplates = [
        { id: '1', name: 'Default' },
        { id: '2', name: 'Professional' },
      ];
      prismaMock.resumeTemplate.findMany.mockResolvedValue(mockTemplates);

      const result = await service.getTemplates();
      expect(result).toEqual(mockTemplates);
    });
  });
});
