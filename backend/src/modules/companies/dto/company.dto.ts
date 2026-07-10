import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';


export class CreateCompanyDto {
  
  @IsString()
  name: string;

  
  @IsOptional()
  @IsString()
  description?: string;

  
  @IsOptional()
  @IsString()
  website?: string;

  
  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  
  @IsOptional()
  @IsString()
  wardId?: string;

  
  @IsOptional()
  @IsString()
  addressDetail?: string;

  
  @IsOptional()
  @IsEnum(['SIZE_1_50', 'SIZE_51_200', 'SIZE_201_500', 'SIZE_500_PLUS'])
  size?: string;

  
  @IsOptional()
  @IsString()
  industry?: string;
}

export class UpdateCompanyDto {
  
  @IsOptional()
  @IsString()
  name?: string;

  
  @IsOptional()
  @IsString()
  description?: string;

  
  @IsOptional()
  @IsString()
  website?: string;

  
  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  
  @IsOptional()
  @IsString()
  wardId?: string;

  
  @IsOptional()
  @IsString()
  addressDetail?: string;

  
  @IsOptional()
  @IsEnum(['SIZE_1_50', 'SIZE_51_200', 'SIZE_201_500', 'SIZE_500_PLUS'])
  size?: string;

  
  @IsOptional()
  @IsString()
  industry?: string;
}

export class CompanyQueryDto {
  
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
  industry?: string;

  @IsOptional()
  @IsString()
  orderBy?: string;
}
