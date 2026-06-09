import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SavedService } from '../src/modules/saved/saved.service';

describe('SavedService', () => {
  let service: SavedService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      savedJob: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      savedCompany: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new SavedService(prismaMock as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveJob', () => {
    it('should save job', async () => {
      prismaMock.savedJob.findUnique.mockResolvedValue(null);
      prismaMock.savedJob.create.mockResolvedValue({ id: '1', userId: 'user1', jobId: 'job1' });

      const result = await service.saveJob('user1', 'job1');

      expect(result.saved).toBe(true);
    });

    it('should unsave job when already saved', async () => {
      const existing = { id: '1', userId: 'user1', jobId: 'job1' };
      prismaMock.savedJob.findUnique.mockResolvedValue(existing);
      prismaMock.savedJob.delete.mockResolvedValue(existing);

      const result = await service.saveJob('user1', 'job1');

      expect(result.saved).toBe(false);
    });
  });

  describe('getSavedJobs', () => {
    it('should return paginated saved jobs', async () => {
      const mockSavedJobs = [
        { id: '1', jobId: 'job1', job: { title: 'Job 1' } },
      ];
      prismaMock.savedJob.findMany.mockResolvedValue(mockSavedJobs);
      prismaMock.savedJob.count.mockResolvedValue(1);

      const result = await service.getSavedJobs('user1', { page: 1, limit: 10 });

      expect(result.items).toEqual(mockSavedJobs);
      expect(result.total).toBe(1);
    });
  });

  describe('saveCompany', () => {
    it('should save company when not saved', async () => {
      prismaMock.savedCompany.findUnique.mockResolvedValue(null);
      prismaMock.savedCompany.create.mockResolvedValue({ id: '1', userId: 'user1', companyId: 'company1' });

      const result = await service.saveCompany('user1', 'company1');
      expect(result.saved).toBe(true);
    });

    it('should unsave company when already saved', async () => {
      const existing = { id: '1', userId: 'user1', companyId: 'company1' };
      prismaMock.savedCompany.findUnique.mockResolvedValue(existing);
      prismaMock.savedCompany.delete.mockResolvedValue(existing);

      const result = await service.saveCompany('user1', 'company1');
      expect(result.saved).toBe(false);
    });
  });

  describe('getSavedCompanies', () => {
    it('should return paginated saved companies', async () => {
      const mockSavedCompanies = [
        { id: '1', companyId: 'company1', company: { name: 'Company 1' } },
      ];
      prismaMock.savedCompany.findMany.mockResolvedValue(mockSavedCompanies);
      prismaMock.savedCompany.count.mockResolvedValue(1);

      const result = await service.getSavedCompanies('user1', { page: 1, limit: 10 });

      expect(result.items).toEqual(mockSavedCompanies);
      expect(result.total).toBe(1);
    });
  });
});
