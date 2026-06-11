import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterEmailDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn(['CANDIDATE', 'EMPLOYER'])
  role: 'CANDIDATE' | 'EMPLOYER';

  @IsOptional()
  @IsString()
  phone?: string;
}
