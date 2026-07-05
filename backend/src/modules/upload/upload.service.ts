import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';

const COMPANY_LOGO_FOLDER = 'job-phuquoc/company-logos';
const CANDIDATE_CV_FOLDER = 'job-phuquoc/candidate-cvs';

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
    const result = await this.cloudinaryService.uploadImage(file, {
      folder: `job-phuquoc/candidate-avatars/${userId}`,
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
      data: { image: result.secure_url },
    });

    // Also update any profile resume if exists
    await this.prisma.candidateResume.updateMany({
      where: { userId, isProfile: true },
      data: { avatar: result.secure_url },
    });

    return {
      message: 'Upload avatar thành công',
      data: {
        avatar: result.secure_url,
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
}
