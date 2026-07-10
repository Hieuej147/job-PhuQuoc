import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';

const COMPANY_LOGO_FOLDER = 'job-phuquoc/company-logos';
const COMPANY_COVER_FOLDER = 'job-phuquoc/company-covers';
const CANDIDATE_CV_FOLDER = 'job-phuquoc/candidate-cvs';
const CANDIDATE_AVATAR_FOLDER = 'job-phuquoc/candidate-avatars';
const POST_IMAGE_FOLDER = 'job-phuquoc/post-images';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async uploadCompanyLogo(userId: string, file: Express.Multer.File) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId: userId },
      select: { id: true, logoPublicId: true },
    });

    if (!company) {
      throw new NotFoundException('Vui lòng tạo hồ sơ công ty trước khi upload logo');
    }

    const oldLogoPublicId = company.logoPublicId;
    const result = await this.cloudinaryService.uploadImage(file, {
      folder: `${COMPANY_LOGO_FOLDER}/${company.id}`,
      resource_type: 'image',
      transformation: [
        { width: 512, height: 512, crop: 'fit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    if (!result.secure_url || !result.public_id) {
      throw new BadRequestException('Cloudinary không trả về URL logo hợp lệ');
    }

    await this.prisma.company.update({
      where: { id: company.id },
      data: {
        logo: result.secure_url,
        logoPublicId: result.public_id,
      },
    });

    if (oldLogoPublicId && oldLogoPublicId !== result.public_id) {
      await this.deleteOldLogo(oldLogoPublicId, company.id);
    }

    return {
      message: 'Upload logo thành công',
      data: {
        companyId: company.id,
        logo: result.secure_url,
      },
    };
  }

  async uploadCompanyCover(userId: string, file: Express.Multer.File) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId: userId },
      select: { id: true, coverImagePublicId: true },
    });

    if (!company) {
      throw new NotFoundException('Vui lòng tạo hồ sơ công ty trước khi upload ảnh bìa');
    }

    const oldCoverPublicId = company.coverImagePublicId;
    const result = await this.cloudinaryService.uploadImage(file, {
      folder: `${COMPANY_COVER_FOLDER}/${company.id}`,
      resource_type: 'image',
      transformation: [
        { width: 1600, height: 500, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    if (!result.secure_url || !result.public_id) {
      throw new BadRequestException('Cloudinary không trả về URL ảnh bìa hợp lệ');
    }

    await this.prisma.company.update({
      where: { id: company.id },
      data: {
        coverImage: result.secure_url,
        coverImagePublicId: result.public_id,
      },
    });

    if (oldCoverPublicId && oldCoverPublicId !== result.public_id) {
      await this.deleteOldCompanyCover(oldCoverPublicId, company.id);
    }

    return {
      message: 'Upload ảnh bìa thành công',
      data: {
        companyId: company.id,
        coverImage: result.secure_url,
      },
    };
  }

  async uploadCandidateCv(userId: string, file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadFile(file, {
      folder: `${CANDIDATE_CV_FOLDER}/${userId}`,
      resource_type: 'image',
      allowed_formats: ['pdf'],
      use_filename: true,
      unique_filename: true,
    });

    if (!result.secure_url || !result.public_id) {
      throw new BadRequestException('Cloudinary không trả về URL CV hợp lệ');
    }

    return {
      message: 'Upload CV thành công',
      data: {
        cvUrl: result.secure_url,
        publicId: result.public_id,
      },
    };
  }

  async uploadCandidateAvatar(userId: string, file: Express.Multer.File) {
    const [user, profile] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true, imagePublicId: true },
      }),
      this.prisma.candidateResume.findFirst({
        where: { userId, isProfile: true },
        select: { id: true, avatarPublicId: true },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const oldAvatarPublicId = profile?.avatarPublicId || user.imagePublicId;

    const result = await this.cloudinaryService.uploadImage(file, {
      folder: `${CANDIDATE_AVATAR_FOLDER}/${userId}`,
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    if (!result.secure_url || !result.public_id) {
      throw new BadRequestException('Cloudinary không trả về URL ảnh hợp lệ');
    }

    // Update user table
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        image: result.secure_url,
        imagePublicId: result.public_id,
      },
    });

    if (profile) {
      await this.prisma.candidateResume.update({
        where: { id: profile.id },
        data: {
          avatar: result.secure_url,
          avatarPublicId: result.public_id,
        },
      });
    } else {
      const defaultTemplate = await this.prisma.resumeTemplate.findFirst({ where: { isActive: true } });
      await this.prisma.candidateResume.create({
        data: {
          userId,
          templateId: defaultTemplate?.id || 'tpl-minimal-03',
          isProfile: true,
          title: 'Hồ sơ của tôi',
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: result.secure_url,
          avatarPublicId: result.public_id,
        },
      });
    }

    if (oldAvatarPublicId && oldAvatarPublicId !== result.public_id) {
      await this.deleteOldAvatar(oldAvatarPublicId, userId);
    }

    return {
      message: 'Upload avatar thành công',
      data: {
        avatar: result.secure_url,
        publicId: result.public_id,
      },
    };
  }

  async uploadPostImage(userId: string, file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadImage(file, {
      folder: `${POST_IMAGE_FOLDER}/${userId}`,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    if (!result.secure_url || !result.public_id) {
      throw new BadRequestException('Cloudinary không trả về URL ảnh hợp lệ');
    }

    return {
      message: 'Upload ảnh thành công',
      url: result.secure_url,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    };
  }

  private async deleteOldLogo(publicId: string, companyId: string) {
    try {
      await this.cloudinaryService.deleteFile(publicId);
    } catch (error) {
      this.logger.warn(`Không xoá được logo cũ trên Cloudinary cho company ${companyId}: ${publicId}`);
    }
  }

  private async deleteOldCompanyCover(publicId: string, companyId: string) {
    if (!publicId.startsWith(`${COMPANY_COVER_FOLDER}/${companyId}/`)) {
      this.logger.warn(`Bỏ qua xoá ảnh bìa không thuộc folder hệ thống cho company ${companyId}: ${publicId}`);
      return;
    }

    try {
      await this.cloudinaryService.deleteFile(publicId);
    } catch (error) {
      this.logger.warn(`Không xoá được ảnh bìa cũ trên Cloudinary cho company ${companyId}: ${publicId}`);
    }
  }

  private async deleteOldAvatar(publicId: string, userId: string) {
    if (!publicId.startsWith(`${CANDIDATE_AVATAR_FOLDER}/${userId}/`)) {
      this.logger.warn(`Bỏ qua xoá avatar không thuộc folder hệ thống cho user ${userId}: ${publicId}`);
      return;
    }

    try {
      await this.cloudinaryService.deleteFile(publicId);
    } catch (error) {
      this.logger.warn(`Không xoá được avatar cũ trên Cloudinary cho user ${userId}: ${publicId}`);
    }
  }
}
