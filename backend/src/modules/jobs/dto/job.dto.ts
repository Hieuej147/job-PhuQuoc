import { IsString, IsOptional, IsInt, IsEnum, IsDateString, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';


export class CreateJobDto {

  @IsString()
  title: string;


  @IsString()
  description: string;


  @IsOptional()
  @IsString()
  requirements?: string;


  @IsOptional()
  @IsString()
  benefits?: string;


  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;


  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin?: number;


  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax?: number;


  @IsOptional()
  @IsString()
  wardId?: string;


  @IsOptional()
  @IsString()
  addressDetail?: string;


  @IsOptional()
  @IsEnum(['FULL_TIME', 'PART_TIME', 'REMOTE', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'])
  type?: string;


  @IsOptional()
  @IsEnum(['NO_EXPERIENCE', 'UNDER_1_YEAR', 'ONE_TO_THREE_YEARS', 'THREE_TO_FIVE_YEARS', 'OVER_FIVE_YEARS'])
  experience?: string;


  @IsOptional()
  @IsEnum(['INTERN', 'FRESHER', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR'])
  level?: string;


  @IsOptional()
  @IsDateString()
  deadline?: string;


  @IsString()
  categoryId: string;
}

export class UpdateJobDto {

  @IsOptional()
  @IsString()
  title?: string;


  @IsOptional()
  @IsString()
  description?: string;


  @IsOptional()
  @IsString()
  requirements?: string;


  @IsOptional()
  @IsString()
  benefits?: string;


  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;


  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin?: number;


  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax?: number;


  @IsOptional()
  @IsString()
  wardId?: string;


  @IsOptional()
  @IsString()
  addressDetail?: string;


  @IsOptional()
  @IsEnum(['FULL_TIME', 'PART_TIME', 'REMOTE', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'])
  type?: string;


  @IsOptional()
  @IsEnum(['NO_EXPERIENCE', 'UNDER_1_YEAR', 'ONE_TO_THREE_YEARS', 'THREE_TO_FIVE_YEARS', 'OVER_FIVE_YEARS'])
  experience?: string;


  @IsOptional()
  @IsEnum(['INTERN', 'FRESHER', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR'])
  level?: string;


  @IsOptional()
  @IsDateString()
  deadline?: string;


  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class JobQueryDto {

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


  @IsOptional()
  @IsString()
  type?: string;


  @IsOptional()
  @IsString()
  experience?: string;


  @IsOptional()
  @IsString()
  level?: string;


  @IsOptional()
  @IsString()
  status?: string;


  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMin?: number;


  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMax?: number;


  @IsOptional()
  @IsString()
  salaryRange?: string;

  @IsOptional()
  @IsString()
  wardId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}

export class MyJobsQueryDto {

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
  status?: string;
}

export class VectorSearchDto {
  @IsArray()
  embedding: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
