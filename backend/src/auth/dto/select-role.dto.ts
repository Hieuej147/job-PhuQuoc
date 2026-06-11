import { IsIn } from 'class-validator';

export class SelectRoleDto {
  @IsIn(['CANDIDATE', 'EMPLOYER'])
  role!: 'CANDIDATE' | 'EMPLOYER';
}
