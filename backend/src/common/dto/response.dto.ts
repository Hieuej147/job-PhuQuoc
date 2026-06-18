import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({ example: [] })
  items: T[];
  @ApiProperty({ example: 120 })
  total: number;
  @ApiProperty({ example: 1 })
  page: number;
  @ApiProperty({ example: 20 })
  limit: number;
  @ApiProperty({ example: 6 })
  totalPages: number;
}

export class ApiResponseDto<T> {
  @ApiProperty({ example: {} })
  data: T;
  @ApiProperty({ example: '2026-06-17T12:00:00.000Z' })
  timestamp: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Thao tác thành công' })
  message: string;
}
