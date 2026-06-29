import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UploadService } from './upload.service';

const MAX_COMPANY_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_COMPANY_LOGO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('company-logo')
  @Roles('EMPLOYER')
  @ApiBearerAuth('better-auth.session_token')
  @ApiOperation({ summary: 'Upload logo công ty', description: 'Employer upload logo công ty lên Cloudinary.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Upload thành công' })
  @ApiResponse({ status: 400, description: 'File không hợp lệ hoặc Cloudinary chưa cấu hình' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không phải EMPLOYER' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_COMPANY_LOGO_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_COMPANY_LOGO_TYPES.has(file.mimetype)) {
          callback(new BadRequestException('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadCompanyLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserSession,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn một file');
    }
    if (!ALLOWED_COMPANY_LOGO_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');
    }
    if (file.size > MAX_COMPANY_LOGO_SIZE) {
      throw new BadRequestException('File vượt quá giới hạn 5MB');
    }

    return this.uploadService.uploadCompanyLogo(user.user.id, file);
  }
}
