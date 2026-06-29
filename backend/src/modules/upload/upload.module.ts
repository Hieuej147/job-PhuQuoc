import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CloudinaryService } from './cloudinary.service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [PrismaModule],
  controllers: [UploadController],
  providers: [CloudinaryService, UploadService],
  exports: [CloudinaryService, UploadService],
})
export class UploadModule {}
