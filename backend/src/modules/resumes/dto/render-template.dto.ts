import { IsOptional, IsString } from 'class-validator';

export class RenderTemplateDto {
  @IsString()
  templateId: string;

  @IsOptional()
  data?: any;

  @IsOptional()
  @IsString()
  mode?: string;
}
