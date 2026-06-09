import { IsString, IsOptional, IsBoolean, IsEnum, IsObject, IsInt, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { BlogType } from '@prisma/client';

export class CreateBlogDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(BlogType)
  type?: BlogType;

  @ValidateIf((o) => o.type !== 'LANDING_PAGE')
  @IsString()
  content?: string;

  @ValidateIf((o) => o.type === 'LANDING_PAGE')
  @IsObject()
  landingContent?: { html: string; css: string; js?: string };

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(BlogType)
  type?: BlogType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsObject()
  landingContent?: { html: string; css: string; js?: string };

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class BlogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
