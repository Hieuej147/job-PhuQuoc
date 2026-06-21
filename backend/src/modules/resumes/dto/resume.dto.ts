import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateResumeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  socialLinks?: Array<{ platform: string; url: string }>;

  @IsOptional()
  @IsArray()
  education?: Array<{ school: string; degree: string; field: string; startYear: number; endYear: number; description: string; GPA: string }>;

  @IsOptional()
  @IsArray()
  experience?: Array<{ company: string; position: string; startYear: number; endYear: number; description: string }>;

  @IsOptional()
  @IsArray()
  projects?: Array<{ name: string; position: string; link: string; description: string }>;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  languages?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsString()
  templateId: string;
}

export class UpdateResumeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  socialLinks?: Array<{ platform: string; url: string }>;

  @IsOptional()
  @IsArray()
  education?: Array<{ school: string; degree: string; field: string; startYear: number; endYear: number; description: string; GPA: string }>;

  @IsOptional()
  @IsArray()
  experience?: Array<{ company: string; position: string; startYear: number; endYear: number; description: string }>;

  @IsOptional()
  @IsArray()
  projects?: Array<{ name: string; position: string; link: string; description: string }>;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  languages?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  htmlTemplate: string;

  @IsString()
  cssTemplate: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  htmlTemplate?: string;

  @IsOptional()
  @IsString()
  cssTemplate?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
