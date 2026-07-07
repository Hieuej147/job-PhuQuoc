import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplicationsService } from '../src/modules/applications/applications.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prismaMock: any;
  let auditServiceMock: any;
  let jobContractMock: any;
  let companyContractMock: any;
  let eventsPublisherMock: any;

  beforeEach(() => {
    prismaMock = {
      jobApplication: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      job: {
        findUnique: vi.fn(),
      },
    };
    auditServiceMock = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    jobContractMock = {
      findById: vi.fn(),
      findByCompanyId: vi.fn(),
      updateStatus: vi.fn(),
    };
    companyContractMock = {
      findById: vi.fn(),
      findByOwnerId: vi.fn(),
    };
    eventsPublisherMock = {
      applicationCreated: vi.fn(),
      applicationAccepted: vi.fn(),
      applicationRejected: vi.fn(),
    };
    service = new ApplicationsService(
      prismaMock as any,
      auditServiceMock,
      jobContractMock,
      companyContractMock,
      eventsPublisherMock,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('apply', () => {
    it('should create application and emit events', async () => {
      const mockJob = { id: 'job1', title: 'Job 1', status: 'ACTIVE', companyId: 'company1' };
      const mockApplication = {
        id: 'app1',
        userId: 'user1',
        jobId: 'job1',
        status: 'PENDING',
        job: {
          title: 'Job 1',
          company: { name: 'Company 1', ownerId: 'employer1' },
        },
      };
      jobContractMock.findById.mockResolvedValue(mockJob);
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);
      prismaMock.jobApplication.create.mockResolvedValue(mockApplication);

      const result = await service.apply('user1', { jobId: 'job1' });

      expect(result).toEqual(mockApplication);
      expect(eventsPublisherMock.applicationCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: 'app1',
          jobTitle: 'Job 1',
          companyName: 'Company 1',
          employerId: 'employer1',
        }),
      );
    });

    it('should throw ConflictException when already applied', async () => {
      const mockJob = { id: 'job1', title: 'Job 1', status: 'ACTIVE', companyId: 'company1' };
      const existingApplication = { id: 'app1', userId: 'user1', jobId: 'job1' };
      jobContractMock.findById.mockResolvedValue(mockJob);
      prismaMock.jobApplication.findUnique.mockResolvedValue(existingApplication);

      await expect(service.apply('user1', { jobId: 'job1' })).rejects.toThrow('Already applied to this job');
    });
  });

  describe('findByUser', () => {
    it('should return paginated applications for user', async () => {
      const mockApplications = [
        { id: 'app1', jobId: 'job1', status: 'PENDING' },
        { id: 'app2', jobId: 'job2', status: 'ACCEPTED' },
      ];
      prismaMock.jobApplication.findMany.mockResolvedValue(mockApplications);
      prismaMock.jobApplication.count.mockResolvedValue(2);

      const result = await service.findByUser('user1', { page: 1, limit: 10 });

      expect(result.items).toEqual(mockApplications);
      expect(result.total).toBe(2);
    });

    it('should convert page and limit to numbers', async () => {
      prismaMock.jobApplication.findMany.mockResolvedValue([]);
      prismaMock.jobApplication.count.mockResolvedValue(0);

      await service.findByUser('user1', { page: '2' as any, limit: '5' as any });

      expect(prismaMock.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('checkApplied', () => {
    it('should return applied true when application exists', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue({ id: 'app1', status: 'PENDING' });

      const result = await service.checkApplied('user1', 'job1');

      expect(prismaMock.jobApplication.findUnique).toHaveBeenCalledWith({
        where: { userId_jobId: { userId: 'user1', jobId: 'job1' } },
        select: { id: true, status: true },
      });
      expect(result).toEqual({ applied: true, applicationId: 'app1', status: 'PENDING' });
    });

    it('should return applied false when application does not exist', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);

      const result = await service.checkApplied('user1', 'job1');

      expect(result).toEqual({ applied: false, applicationId: null, status: null });
    });
  });

  describe('findByJob', () => {
    it('should return applications for job when owner', async () => {
      const mockJob = { id: 'job1', companyId: 'company1' };
      const mockCompany = { id: 'company1', ownerId: 'employer1' };
      const mockApplications = [
        { id: 'app1', userId: 'user1', status: 'PENDING' },
      ];
      jobContractMock.findById.mockResolvedValue(mockJob);
      companyContractMock.findByOwnerId.mockResolvedValue(mockCompany);
      prismaMock.jobApplication.findMany.mockResolvedValue(mockApplications);
      prismaMock.jobApplication.count.mockResolvedValue(1);

      const result = await service.findByJob('job1', 'employer1', { page: 1, limit: 10 });

      expect(result.data.items).toEqual(mockApplications);
    });

    it('should throw NotFoundException when job not found', async () => {
      jobContractMock.findById.mockResolvedValue(null);

      await expect(service.findByJob('nonexistent', 'employer1', {})).rejects.toThrow('Job not found');
    });

    it('should throw ForbiddenException when not job owner', async () => {
      const mockJob = { id: 'job1', companyId: 'company1' };
      const mockCompany = { id: 'company1', ownerId: 'employer1' };
      jobContractMock.findById.mockResolvedValue(mockJob);
      companyContractMock.findByOwnerId.mockResolvedValue(null);

      await expect(service.findByJob('job1', 'employer2', {})).rejects.toThrow('Not company owner');
    });
  });

  describe('updateStatus', () => {
    it('should update status and emit event for ACCEPTED', async () => {
      const mockApp = {
        id: 'app1',
        status: 'PENDING',
        userId: 'user1',
        job: {
          title: 'Job 1',
          company: { ownerId: 'employer1', name: 'Company 1' },
        },
      };
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockApp);
      prismaMock.jobApplication.update.mockResolvedValue({ ...mockApp, status: 'ACCEPTED' });

      await service.updateStatus('app1', 'employer1', 'ACCEPTED');

      expect(eventsPublisherMock.applicationAccepted).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: 'app1',
          candidateId: 'user1',
        }),
      );
    });

    it('should update status and emit event for REJECTED', async () => {
      const mockApp = {
        id: 'app1',
        status: 'PENDING',
        userId: 'user1',
        job: {
          title: 'Job 1',
          company: { ownerId: 'employer1', name: 'Company 1' },
        },
      };
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockApp);
      prismaMock.jobApplication.update.mockResolvedValue({ ...mockApp, status: 'REJECTED' });

      await service.updateStatus('app1', 'employer1', 'REJECTED');

      expect(eventsPublisherMock.applicationRejected).toHaveBeenCalledWith(
        expect.objectContaining({ applicationId: 'app1' }),
      );
    });

    it('should throw NotFoundException when application not found', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('nonexistent', 'employer1', 'ACCEPTED')).rejects.toThrow('Application not found');
    });

    it('should throw ForbiddenException when not job owner', async () => {
      const mockApp = {
        id: 'app1',
        job: { company: { ownerId: 'employer1' } },
      };
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockApp);

      await expect(service.updateStatus('app1', 'employer2', 'ACCEPTED')).rejects.toThrow('Not company owner');
    });
  });

  describe('toggleBookmark', () => {
    it('should toggle bookmark', async () => {
      const mockApp = {
        id: 'app1',
        isBookmarked: false,
        job: { company: { ownerId: 'employer1' } },
      };
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockApp);
      prismaMock.jobApplication.update.mockResolvedValue({ ...mockApp, isBookmarked: true });

      const result = await service.toggleBookmark('app1', 'employer1');
      expect(result.isBookmarked).toBe(true);
    });

    it('should throw NotFoundException when application not found', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);

      await expect(service.toggleBookmark('nonexistent', 'employer1')).rejects.toThrow('Application not found');
    });
  });

  describe('remove', () => {
    it('should delete application when owner', async () => {
      const mockApp = { id: 'app1', userId: 'user1' };
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockApp);
      prismaMock.jobApplication.delete.mockResolvedValue(mockApp);

      const result = await service.remove('app1', 'user1');
      expect(result.message).toBe('Application withdrawn');
    });

    it('should throw NotFoundException when application not found', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'user1')).rejects.toThrow('Application not found');
    });

    it('should throw ForbiddenException when not owner', async () => {
      const mockApp = { id: 'app1', userId: 'user1' };
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockApp);

      await expect(service.remove('app1', 'user2')).rejects.toThrow('Not your application');
    });
  });
});
