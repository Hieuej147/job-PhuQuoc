import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  private configured = false;

  constructor(private readonly config: ConfigService) {}

  async uploadImage(file: Express.Multer.File, options: UploadApiOptions): Promise<UploadApiResponse> {
    this.ensureConfigured();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          ...options,
        },
        (error, result) => {
          if (error) return reject(new BadRequestException(`Upload thất bại: ${error.message}`));
          if (!result) return reject(new BadRequestException('Cloudinary không trả về kết quả upload'));
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string) {
    this.ensureConfigured();
    return cloudinary.uploader.destroy(publicId);
  }

  private ensureConfigured() {
    if (this.configured) return;

    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException('Cloudinary chưa được cấu hình. Thiếu CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY hoặc CLOUDINARY_API_SECRET.');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    this.configured = true;
  }
}
