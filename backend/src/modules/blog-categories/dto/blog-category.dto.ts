import { IsString, IsOptional } from 'class-validator';


export class CreateBlogCategoryDto {
  
  @IsString()
  name: string;
}

export class UpdateBlogCategoryDto {
  
  @IsOptional()
  @IsString()
  name?: string;
}
