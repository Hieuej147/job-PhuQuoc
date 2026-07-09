import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobsService } from '../src/modules/jobs/jobs.service';

describe('JobsService', () => {
  let service: JobsService;
  let prismaMock: any;
  let auditServiceMock: any;
  let cacheMock: any;
  let companyContractMock: any;
  let jobBackgroundMock: any;

  beforeEach(() => {
    prismaMock = {
      job: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      company: {
        findUnique: vi.fn(),
      },
    };
    auditServiceMock = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    cacheMock = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      delPattern: vi.fn().mockResolvedValue(undefined),
      generateKey: vi.fn().mockReturnValue('test-key'),
    };
    companyContractMock = {
      findById: vi.fn(),
      findByOwnerId: vi.fn(),
    };
    jobBackgroundMock = {
      syncEmbedding: vi.fn(),
    };
    service = new JobsService(prismaMock as any, auditServiceMock, cacheMock as any, companyContractMock, jobBackgroundMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated jobs with ACTIVE status by default', async () => {
      const mockJobs = [
        { id: '1', title: 'Job 1', status: 'ACTIVE' },
        { id: '2', title: 'Job 2', status: 'ACTIVE' },
      ];
      prismaMock.job.findMany.mockResolvedValue(mockJobs);
      prismaMock.job.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 }) as any;

      expect(result.items).toEqual(mockJobs);
      expect(result.total).toBe(2);
      expect(prismaMock.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('should ignore custom status for public queries', async () => {
      prismaMock.job.findMany.mockResolvedValue([]);
      prismaMock.job.count.mockResolvedValue(0);

      await service.findAll({ status: 'DRAFT' });

      expect(prismaMock.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('should convert page and limit to numbers', async () => {
      prismaMock.job.findMany.mockResolvedValue([]);
      prismaMock.job.count.mockResolvedValue(0);

      await service.findAll({ page: '2' as any, limit: '5' as any });

      expect(prismaMock.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return job when found', async () => {
      const mockJob = { id: '1', title: 'Job 1', status: 'ACTIVE' };
      prismaMock.job.findUnique.mockResolvedValue(mockJob);

      const result = await service.findById('1');
      expect(result).toEqual(mockJob);
    });

    it('should throw NotFoundException when job not found', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow('Job not found');
    });
  });

  describe('create', () => {
    it('should create job with DRAFT status', async () => {
      const mockCompany = { id: 'company1', ownerId: 'user1' };
      const mockJob = { id: '1', title: 'New Job', status: 'DRAFT', companyId: 'company1' };
      
      companyContractMock.findByOwnerId.mockResolvedValue(mockCompany);
      prismaMock.job.create.mockResolvedValue(mockJob);

      const result = await service.create('user1', {
        title: 'New Job',
        description: 'Job description',
        categoryId: 'cat1',
      });

      expect(result.status).toBe('DRAFT');
      expect(result.companyId).toBe('company1');
    });

    it('should throw NotFoundException when company not found', async () => {
      companyContractMock.findByOwnerId.mockResolvedValue(null);

      await expect(service.create('user1', {
        title: 'New Job',
        description: 'Job description',
        categoryId: 'cat1',
      })).rejects.toThrow('You need a company to post jobs');
    });

    it('should auto-generate slug', async () => {
      const mockCompany = { id: 'company1', ownerId: 'user1' };
      companyContractMock.findByOwnerId.mockResolvedValue(mockCompany);
      prismaMock.job.create.mockImplementation((args: any) => 
        Promise.resolve({ ...args.data, id: '1' })
      );

      await service.create('user1', {
        title: 'Frontend Developer',
        description: 'Job description',
        categoryId: 'cat1',
      });

      expect(prismaMock.job.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: expect.stringContaining('frontend-developer'),
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update job when owner', async () => {
      const mockJob = {
        id: '1',
        company: { ownerId: 'user1' },
      };
      prismaMock.job.findUnique.mockResolvedValue(mockJob);
      prismaMock.job.update.mockResolvedValue({ ...mockJob, title: 'Updated' });

      const result = await service.update('1', 'user1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundException when job not found', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', 'user1', {})).rejects.toThrow('Job not found');
    });

    it('should throw ForbiddenException when not owner', async () => {
      const mockJob = {
        id: '1',
        company: { ownerId: 'user1' },
      };
      prismaMock.job.findUnique.mockResolvedValue(mockJob);

      await expect(service.update('1', 'user2', {})).rejects.toThrow('Not company owner');
    });
  });

  describe('remove', () => {
    it('should delete job when found', async () => {
      const mockJob = { id: '1', title: 'Job 1' };
      prismaMock.job.findUnique.mockResolvedValue(mockJob);
      prismaMock.job.delete.mockResolvedValue(mockJob);

      const result = await service.remove('1');
      expect(result.message).toBe('Job deleted');
    });

    it('should throw NotFoundException when job not found', async () => {
      prismaMock.job.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow('Job not found');
    });
  });
});
