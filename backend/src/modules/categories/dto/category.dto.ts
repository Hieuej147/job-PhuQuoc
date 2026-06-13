import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';


export class CategoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}


export class CreateCategoryDto {
  
  @IsString()
  name: string;

  
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateCategoryDto {
  
  @IsOptional()
  @IsString()
  name?: string;

  
  @IsOptional()
  @IsString()
  icon?: string;
}
