import { BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../src/auth/decorators/roles.decorator';
import { UploadController } from '../src/modules/upload/upload.controller';

const userSession = {
  user: { id: 'employer-1' },
} as any;

const createFile = (overrides: Partial<Express.Multer.File> = {}) =>
  ({
    buffer: Buffer.from('image'),
    mimetype: 'image/png',
    originalname: 'logo.png',
    size: 1024,
    ...overrides,
  }) as Express.Multer.File;

describe('UploadController', () => {
  it('rejects missing file', async () => {
    const controller = new UploadController({ uploadCompanyLogo: vi.fn() } as any);

    await expect(controller.uploadCompanyLogo(undefined as any, userSession)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unsupported MIME type', async () => {
    const controller = new UploadController({ uploadCompanyLogo: vi.fn() } as any);

    await expect(
      controller.uploadCompanyLogo(createFile({ mimetype: 'application/pdf' }), userSession),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects file larger than 5MB', async () => {
    const controller = new UploadController({ uploadCompanyLogo: vi.fn() } as any);

    await expect(
      controller.uploadCompanyLogo(createFile({ size: 5 * 1024 * 1024 + 1 }), userSession),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('delegates valid company logo upload to service', async () => {
    const file = createFile();
    const uploadCompanyLogo = vi.fn().mockResolvedValue({
      message: 'Upload logo thành công',
      data: {
        companyId: 'company-1',
        logo: 'https://res.cloudinary.com/demo/logo.png',
      },
    });
    const controller = new UploadController({ uploadCompanyLogo } as any);

    const result = await controller.uploadCompanyLogo(file, userSession);

    expect(uploadCompanyLogo).toHaveBeenCalledWith('employer-1', file);
    expect(result).toEqual({
      message: 'Upload logo thành công',
      data: {
        companyId: 'company-1',
        logo: 'https://res.cloudinary.com/demo/logo.png',
      },
    });
  });

  it('allows only candidate and employer roles to upload blog post images', () => {
    const reflector = new Reflector();
    const roles = reflector.get<string[]>(ROLES_KEY, UploadController.prototype.uploadPostImage);

    expect(roles).toEqual(['CANDIDATE', 'EMPLOYER']);
  });

  it('delegates valid blog post image upload to service', async () => {
    const file = createFile();
    const uploadPostImage = vi.fn().mockResolvedValue({
      message: 'Upload ảnh thành công',
      url: 'https://res.cloudinary.com/demo/post.png',
      data: {
        url: 'https://res.cloudinary.com/demo/post.png',
        publicId: 'post-id',
      },
    });
    const controller = new UploadController({ uploadPostImage } as any);

    const result = await controller.uploadPostImage(file, userSession);

    expect(uploadPostImage).toHaveBeenCalledWith('employer-1', file);
    expect(result).toEqual({
      message: 'Upload ảnh thành công',
      url: 'https://res.cloudinary.com/demo/post.png',
      data: {
        url: 'https://res.cloudinary.com/demo/post.png',
        publicId: 'post-id',
      },
    });
  });
});
