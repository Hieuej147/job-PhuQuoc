import { IsString, IsOptional, IsEnum } from 'class-validator';


export class CreateApplicationDto {
  
  @IsString()
  jobId: string;

  
  @IsOptional()
  @IsString()
  cvUrl?: string;

  
  @IsOptional()
  @IsString()
  resumeId?: string;

  
  @IsOptional()
  @IsString()
  coverLetter?: string;
}

export class UpdateApplicationStatusDto {
  
  @IsEnum(['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED'])
  status: string;
}
