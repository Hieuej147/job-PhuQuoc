import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterEmailDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'candidate@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secret1234' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: ['CANDIDATE', 'EMPLOYER'], example: 'CANDIDATE' })
  @IsIn(['CANDIDATE', 'EMPLOYER'])
  role: 'CANDIDATE' | 'EMPLOYER';

  @ApiPropertyOptional({ example: '0909123456' })
  @IsOptional()
  @IsString()
  phone?: string;
}
