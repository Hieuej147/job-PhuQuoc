import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CompleteEmailRegistrationDto {
  @ApiProperty({ example: 'candidate@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ example: 'Secret1234' })
  @IsString()
  @MinLength(8)
  password: string;
}
