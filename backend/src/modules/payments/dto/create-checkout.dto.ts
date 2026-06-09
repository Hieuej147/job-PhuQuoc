import { IsString } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  jobId: string;

  @IsString()
  packageId: string;
}
