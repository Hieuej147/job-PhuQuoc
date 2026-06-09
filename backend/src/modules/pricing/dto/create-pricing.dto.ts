import { IsString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreatePricingDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  days: number;

  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
