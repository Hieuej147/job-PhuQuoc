import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendEmailDto {
    @IsEmail()
    to: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(300)
    subject: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20000)
    body: string;
}