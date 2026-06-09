export class PaginatedResponseDto<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ApiResponseDto<T> {
  data: T;
  timestamp: string;
}

export class MessageResponseDto {
  message: string;
}
