import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplicationsService } from '../src/modules/applications/applications.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prismaMock: any;
  let auditServiceMock: any;
  let jobContractMock: any;
  let companyContractMock: any;
  let eventsPublisherMock: any;
  let quotaServiceMock: any;
  let cacheMock: any;

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
      applicationMessage: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      notification: {
        create: vi.fn(),
        upsert: vi.fn(),
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
    quotaServiceMock = {
      assertWithinForUser: vi.fn().mockResolvedValue(undefined),
      assertMaxForUser: vi.fn().mockResolvedValue(undefined),
      getUserQuotaSnapshot: vi.fn(),
    };
    cacheMock = {
      set: vi.fn().mockResolvedValue(undefined),
      has: vi.fn().mockResolvedValue(false),
    };
    service = new ApplicationsService(
      prismaMock as any,
      auditServiceMock,
      jobContractMock,
      companyContractMock,
      eventsPublisherMock,
      quotaServiceMock,
      cacheMock,
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

    it('should save employer message without creating duplicate chat notification', async () => {
      const mockApp = {
        id: 'app1',
        status: 'PENDING',
        userId: 'candidate1',
        user: { id: 'candidate1', name: 'Candidate' },
        job: {
          id: 'job1',
          title: 'Job 1',
          company: { id: 'company1', ownerId: 'employer1', name: 'Company 1' },
        },
      };
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockApp);
      prismaMock.jobApplication.update.mockResolvedValue({ ...mockApp, status: 'ACCEPTED' });
      prismaMock.applicationMessage.count.mockResolvedValue(0);
      prismaMock.applicationMessage.create.mockResolvedValue({ id: 'msg1', body: 'Hẹn phỏng vấn nhé', senderRole: 'EMPLOYER' });

      await service.updateStatus('app1', 'employer1', 'ACCEPTED', 'Hẹn phỏng vấn nhé');

      expect(prismaMock.applicationMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            applicationId: 'app1',
            senderId: 'employer1',
            senderRole: 'EMPLOYER',
            body: 'Hẹn phỏng vấn nhé',
          }),
        }),
      );
      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it('should close chat when application is rejected with employer message', async () => {
      const mockApp = {
        id: 'app1',
        userId: 'candidate1',
        status: 'REVIEWING',
        user: { id: 'candidate1' },
        job: {
          title: 'Job 1',
          company: { id: 'company1', ownerId: 'employer1', name: 'Company 1' },
        },
      };
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockApp);
      prismaMock.jobApplication.update.mockResolvedValue({
        ...mockApp,
        status: 'REJECTED',
        employerMessage: 'Hồ sơ chưa phù hợp',
        chatClosedAt: new Date(),
        chatClosedBy: 'employer1',
        chatCloseReason: 'REJECTED',
      });
      prismaMock.applicationMessage.count.mockResolvedValue(0);
      prismaMock.applicationMessage.create.mockResolvedValue({ id: 'msg1', body: 'Hồ sơ chưa phù hợp', senderRole: 'EMPLOYER' });

      await service.updateStatus('app1', 'employer1', 'REJECTED', 'Hồ sơ chưa phù hợp');

      expect(prismaMock.jobApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REJECTED',
            chatClosedAt: expect.any(Date),
            chatClosedBy: 'employer1',
            chatCloseReason: 'REJECTED',
          }),
        }),
      );
      expect(prismaMock.applicationMessage.create).toHaveBeenCalled();
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

  describe('application messages', () => {
    const mockChatApp = {
      id: 'app1',
      userId: 'candidate1',
      status: 'ACCEPTED',
      chatClosedAt: null,
      user: { id: 'candidate1', name: 'Candidate' },
      job: {
        id: 'job1',
        title: 'Frontend Developer',
        company: { id: 'company1', name: 'Company 1', ownerId: 'employer1' },
      },
    };

    it('should list messages for candidate application', async () => {
      const messages = [{ id: 'msg1', body: 'Hello', senderRole: 'EMPLOYER' }];
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockChatApp);
      prismaMock.applicationMessage.findMany.mockResolvedValue(messages);

      const result = await service.findMessages('app1', 'candidate1');

      expect(result.items).toEqual(messages);
      expect(prismaMock.applicationMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { applicationId: 'app1', hiddenForCandidate: false },
          orderBy: { createdAt: 'asc' },
        }),
      );
      expect(cacheMock.set).toHaveBeenCalledWith('application-chat:open:app1:candidate1', true, 15);
    });

    it('should create message and notify recipient', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockChatApp);
      prismaMock.applicationMessage.count.mockResolvedValue(0);
      prismaMock.applicationMessage.create.mockResolvedValue({ id: 'msg1', body: 'Dạ được ạ', senderRole: 'CANDIDATE' });
      prismaMock.notification.upsert.mockResolvedValue({ id: 'noti1' });

      const result = await service.sendMessage('app1', 'candidate1', ' Dạ được ạ ');

      expect(result).toEqual(expect.objectContaining({ id: 'msg1' }));
      expect(prismaMock.applicationMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            applicationId: 'app1',
            senderId: 'candidate1',
            senderRole: 'CANDIDATE',
            body: 'Dạ được ạ',
          }),
        }),
      );
      expect(prismaMock.notification.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_dedupeKey: expect.objectContaining({
              userId: 'employer1',
            }),
          },
          create: expect.objectContaining({
            userId: 'employer1',
            refType: 'application',
            refId: 'app1',
          }),
        }),
      );
    });

    it('should not create chat notification when recipient is currently viewing the thread', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockChatApp);
      prismaMock.applicationMessage.count.mockResolvedValue(0);
      prismaMock.applicationMessage.create.mockResolvedValue({ id: 'msg1', body: 'Dạ được ạ', senderRole: 'CANDIDATE' });
      cacheMock.has.mockResolvedValue(true);

      await service.sendMessage('app1', 'candidate1', 'Dạ được ạ');

      expect(cacheMock.has).toHaveBeenCalledWith('application-chat:open:app1:employer1');
      expect(prismaMock.notification.create).not.toHaveBeenCalled();
      expect(prismaMock.notification.upsert).not.toHaveBeenCalled();
    });

    it('should reject empty message', async () => {
      await expect(service.sendMessage('app1', 'candidate1', '   ')).rejects.toThrow('Nội dung tin nhắn không được để trống.');
    });

    it('should reject message when limit reached', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockChatApp);
      prismaMock.applicationMessage.count.mockResolvedValue(100);

      await expect(service.sendMessage('app1', 'candidate1', 'Hello')).rejects.toThrow();
    });

    it('should reject chat before application is accepted', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue({ ...mockChatApp, status: 'REVIEWING' });

      await expect(service.sendMessage('app1', 'candidate1', 'Hello')).rejects.toThrow(
        'Chỉ có thể nhắn tin sau khi hồ sơ được chấp nhận.',
      );
    });

    it('should reject chat when application is rejected', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue({ ...mockChatApp, status: 'REJECTED' });

      await expect(service.sendMessage('app1', 'candidate1', 'Hello')).rejects.toThrow(
        'Hồ sơ đã bị từ chối, cuộc trò chuyện chỉ còn chế độ xem.',
      );
    });

    it('should reject chat when thread is closed', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue({ ...mockChatApp, chatClosedAt: new Date() });

      await expect(service.sendMessage('app1', 'candidate1', 'Hello')).rejects.toThrow('Cuộc trò chuyện đã đóng.');
    });

    it('should close chat for employer owner', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockChatApp);
      prismaMock.jobApplication.update.mockResolvedValue({
        ...mockChatApp,
        chatClosedAt: new Date(),
        chatClosedBy: 'employer1',
        chatCloseReason: 'EMPLOYER_ARCHIVED',
      });

      const result = await service.closeChat('app1', 'employer1');

      expect(result.chatCloseReason).toBe('EMPLOYER_ARCHIVED');
      expect(prismaMock.jobApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app1' },
          data: expect.objectContaining({
            chatClosedAt: expect.any(Date),
            chatClosedBy: 'employer1',
            chatCloseReason: 'EMPLOYER_ARCHIVED',
          }),
        }),
      );
      expect(auditServiceMock.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'application.chat.closed' }));
    });

    it('should reject user outside application chat', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockChatApp);

      await expect(service.findMessages('app1', 'otherUser')).rejects.toThrow('Bạn không có quyền truy cập cuộc trò chuyện này.');
    });

    it('should mark unread messages as read', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockChatApp);
      prismaMock.applicationMessage.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.markMessagesRead('app1', 'candidate1');

      expect(result).toEqual({ updated: 2 });
      expect(cacheMock.set).toHaveBeenCalledWith('application-chat:open:app1:candidate1', true, 15);
      expect(prismaMock.applicationMessage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            applicationId: 'app1',
            senderId: { not: 'candidate1' },
            readAt: null,
            hiddenForCandidate: false,
          }),
        }),
      );
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
    it('should hide application from candidate workspace without physical delete when employer has not deleted', async () => {
      const mockApp = { id: 'app1', userId: 'user1', candidateDeletedAt: null, employerDeletedAt: null };
      const updated = { ...mockApp, candidateDeletedAt: new Date() };
      prismaMock.jobApplication.findUnique
        .mockResolvedValueOnce(mockApp)
        .mockResolvedValueOnce(updated);
      prismaMock.jobApplication.update.mockResolvedValue(updated);

      await expect(service.remove('app1', 'user1')).resolves.toEqual({
        message: 'Đã xoá đơn ứng tuyển khỏi danh sách của bạn',
      });
      expect(prismaMock.jobApplication.update).toHaveBeenCalledWith({
        where: { id: 'app1' },
        data: { candidateDeletedAt: expect.any(Date) },
      });
      expect(prismaMock.jobApplication.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when application not found', async () => {
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'user1')).rejects.toThrow('Application not found');
    });

    it('should throw ForbiddenException when not owner', async () => {
      const mockApp = { id: 'app1', userId: 'user1', candidateDeletedAt: null };
      prismaMock.jobApplication.findUnique.mockResolvedValue(mockApp);

      await expect(service.remove('app1', 'user2')).rejects.toThrow('Not your application');
    });
  });
});
