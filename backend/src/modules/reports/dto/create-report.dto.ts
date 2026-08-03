import { IsString, IsEnum, IsOptional, IsObject, MaxLength } from 'class-validator';
import { ReportReason } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ enum: ReportReason, description: 'Lý do báo cáo' })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Bằng chứng kèm theo (URL hình ảnh, JSON...)' })
  @IsOptional()
  @IsObject()
  evidence?: Record<string, any>;
}
