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
      company: {
        findUnique: vi.fn(),
        update: vi.fn(),
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
});
