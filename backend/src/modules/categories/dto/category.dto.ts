import { IsString, IsOptional } from 'class-validator';


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
