import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '../src/modules/audit/audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let prismaMock: any;
  let loggerMock: any;

  beforeEach(() => {
    prismaMock = {
      auditLog: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };
    loggerMock = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
    service = new AuditService(prismaMock as any, loggerMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create audit log', async () => {
      const mockLog = {
        id: '1',
        action: 'user.registered',
        entityType: 'User',
        entityId: 'user1',
        actorId: 'user1',
      };
      prismaMock.auditLog.create.mockResolvedValue(mockLog);

      const result = await service.log({
        action: 'user.registered',
        entityType: 'User',
        entityId: 'user1',
        actorId: 'user1',
      });

      expect(result).toEqual(mockLog);
    });

    it('should handle metadata', async () => {
      const metadata = { ip: '127.0.0.1', userAgent: 'test' };
      prismaMock.auditLog.create.mockResolvedValue({});

      await service.log({
        action: 'user.login',
        metadata,
      });

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata,
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        { id: '1', action: 'user.registered' },
        { id: '2', action: 'job.created' },
      ];
      prismaMock.auditLog.findMany.mockResolvedValue(mockLogs);
      prismaMock.auditLog.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toEqual(mockLogs);
      expect(result.total).toBe(2);
    });

    it('should filter by action', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([]);
      prismaMock.auditLog.count.mockResolvedValue(0);

      await service.findAll({ action: 'user.registered' });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: 'user.registered' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([]);
      prismaMock.auditLog.count.mockResolvedValue(0);

      await service.findAll({
        from: '2024-01-01',
        to: '2024-12-31',
      });

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return audit log when found', async () => {
      const mockLog = { id: '1', action: 'user.registered' };
      prismaMock.auditLog.findUnique.mockResolvedValue(mockLog);

      const result = await service.findById('1');
      expect(result).toEqual(mockLog);
    });

    it('should return null when not found', async () => {
      prismaMock.auditLog.findUnique.mockResolvedValue(null);

      const result = await service.findById('nonexistent');
      expect(result).toBeNull();
    });
  });
});
