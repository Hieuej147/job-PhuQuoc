import { IsEmail, IsString, MinLength } from 'class-validator';

export class CompleteEmailRegistrationDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;

  @IsString()
  @MinLength(8)
  password: string;
}
