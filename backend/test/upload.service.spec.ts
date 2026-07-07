import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { UploadService } from '../src/modules/upload/upload.service';

const createFile = () =>
  ({
    buffer: Buffer.from('image'),
    mimetype: 'image/png',
    originalname: 'logo.png',
    size: 1024,
  }) as Express.Multer.File;

describe('UploadService', () => {
  let prismaMock: any;
  let cloudinaryMock: any;
  let service: UploadService;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      company: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      candidateResume: {
        findFirst: vi.fn(),
        updateMany: vi.fn(),
      },
    };
    cloudinaryMock = {
      uploadImage: vi.fn(),
      deleteFile: vi.fn(),
    };
    service = new UploadService(prismaMock as any, cloudinaryMock as any);
  });

  it('throws when employer has no company profile', async () => {
    prismaMock.company.findUnique.mockResolvedValue(null);

    await expect(service.uploadCompanyLogo('user-1', createFile())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uploads optimized logo, updates company, and returns only logo url', async () => {
    prismaMock.company.findUnique.mockResolvedValue({ id: 'company-1', logoPublicId: null });
    cloudinaryMock.uploadImage.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/demo/logo.webp',
      public_id: 'job-phuquoc/company-logos/company-1/logo-new',
    });
    prismaMock.company.update.mockResolvedValue({});

    const result = await service.uploadCompanyLogo('user-1', createFile());

    expect(cloudinaryMock.uploadImage).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        folder: 'job-phuquoc/company-logos/company-1',
        resource_type: 'image',
        transformation: [
          { width: 512, height: 512, crop: 'fit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      }),
    );
    expect(prismaMock.company.update).toHaveBeenCalledWith({
      where: { id: 'company-1' },
      data: {
        logo: 'https://res.cloudinary.com/demo/logo.webp',
        logoPublicId: 'job-phuquoc/company-logos/company-1/logo-new',
      },
    });
    expect(result).toEqual({
      message: 'Upload logo thành công',
      data: {
        companyId: 'company-1',
        logo: 'https://res.cloudinary.com/demo/logo.webp',
      },
    });
  });

  it('deletes old logo after successful DB update', async () => {
    prismaMock.company.findUnique.mockResolvedValue({ id: 'company-1', logoPublicId: 'old-logo' });
    cloudinaryMock.uploadImage.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/demo/logo.webp',
      public_id: 'new-logo',
    });
    prismaMock.company.update.mockResolvedValue({});

    await service.uploadCompanyLogo('user-1', createFile());

    expect(cloudinaryMock.deleteFile).toHaveBeenCalledWith('old-logo');
  });

  it('does not fail when deleting old logo fails', async () => {
    prismaMock.company.findUnique.mockResolvedValue({ id: 'company-1', logoPublicId: 'old-logo' });
    cloudinaryMock.uploadImage.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/demo/logo.webp',
      public_id: 'new-logo',
    });
    prismaMock.company.update.mockResolvedValue({});
    cloudinaryMock.deleteFile.mockRejectedValue(new Error('delete failed'));

    await expect(service.uploadCompanyLogo('user-1', createFile())).resolves.toEqual({
      message: 'Upload logo thành công',
      data: {
        companyId: 'company-1',
        logo: 'https://res.cloudinary.com/demo/logo.webp',
      },
    });
  });

  it('uploads candidate avatar and does not delete OAuth avatar without public id', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ imagePublicId: null });
    prismaMock.candidateResume.findFirst.mockResolvedValue({ id: 'profile-1', avatarPublicId: null });
    cloudinaryMock.uploadImage.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/demo/avatar.webp',
      public_id: 'job-phuquoc/candidate-avatars/user-1/avatar-new',
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.candidateResume.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.uploadCandidateAvatar('user-1', createFile());

    expect(cloudinaryMock.uploadImage).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        folder: 'job-phuquoc/candidate-avatars/user-1',
        resource_type: 'image',
      }),
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        image: 'https://res.cloudinary.com/demo/avatar.webp',
        imagePublicId: 'job-phuquoc/candidate-avatars/user-1/avatar-new',
      },
    });
    expect(prismaMock.candidateResume.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isProfile: true },
      data: {
        avatar: 'https://res.cloudinary.com/demo/avatar.webp',
        avatarPublicId: 'job-phuquoc/candidate-avatars/user-1/avatar-new',
      },
    });
    expect(cloudinaryMock.deleteFile).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Upload avatar thành công',
      data: {
        avatar: 'https://res.cloudinary.com/demo/avatar.webp',
        publicId: 'job-phuquoc/candidate-avatars/user-1/avatar-new',
      },
    });
  });

  it('deletes previous app-owned candidate avatar after successful update', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      imagePublicId: 'job-phuquoc/candidate-avatars/user-1/avatar-old-user',
    });
    prismaMock.candidateResume.findFirst.mockResolvedValue({
      id: 'profile-1',
      avatarPublicId: 'job-phuquoc/candidate-avatars/user-1/avatar-old-profile',
    });
    cloudinaryMock.uploadImage.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/demo/avatar-new.webp',
      public_id: 'job-phuquoc/candidate-avatars/user-1/avatar-new',
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.candidateResume.updateMany.mockResolvedValue({ count: 1 });

    await service.uploadCandidateAvatar('user-1', createFile());

    expect(cloudinaryMock.deleteFile).toHaveBeenCalledWith('job-phuquoc/candidate-avatars/user-1/avatar-old-profile');
  });

  it('does not delete candidate avatar public id outside current user folder', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      imagePublicId: 'job-phuquoc/candidate-avatars/other-user/avatar-old',
    });
    prismaMock.candidateResume.findFirst.mockResolvedValue(null);
    cloudinaryMock.uploadImage.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/demo/avatar-new.webp',
      public_id: 'job-phuquoc/candidate-avatars/user-1/avatar-new',
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.candidateResume.updateMany.mockResolvedValue({ count: 0 });

    await service.uploadCandidateAvatar('user-1', createFile());

    expect(cloudinaryMock.deleteFile).not.toHaveBeenCalled();
  });
});
