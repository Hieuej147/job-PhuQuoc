import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsEnum(['CANDIDATE', 'EMPLOYER'])
  role?: 'CANDIDATE' | 'EMPLOYER';
}
