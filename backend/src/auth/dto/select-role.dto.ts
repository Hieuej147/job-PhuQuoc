import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class SelectRoleDto {
  @ApiProperty({ enum: ['CANDIDATE', 'EMPLOYER'], example: 'EMPLOYER' })
  @IsIn(['CANDIDATE', 'EMPLOYER'])
  role!: 'CANDIDATE' | 'EMPLOYER';
}
