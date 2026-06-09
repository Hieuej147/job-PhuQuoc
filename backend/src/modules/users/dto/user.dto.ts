import { IsString, IsOptional, IsEmail, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';


export class UpdateUserDto {
  
  @IsOptional()
  @IsString()
  name?: string;

  
  @IsOptional()
  @IsString()
  phone?: string;

  
  @IsOptional()
  @IsString()
  image?: string;
}

export class UserResponseDto {
  
  id: string;

  
  name: string;

  
  email: string;

  
  role: string;

  
  phone: string | null;

  
  image: string | null;

  
  isActive: boolean;

  
  isLocked: boolean;

  
  createdAt: Date;

  
  updatedAt: Date;
}

export class UserQueryDto {
  
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
  role?: string;

  
  @IsOptional()
  @IsString()
  search?: string;
}
