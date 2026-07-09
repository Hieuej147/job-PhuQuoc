import { IsString, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';


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

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  employerMessage?: string;
}

export class CreateApplicationMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;
}
