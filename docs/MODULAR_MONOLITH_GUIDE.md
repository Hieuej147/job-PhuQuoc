# Nguyên tắc viết Module mới (Modular Monolith)

*Trích từ TEAM_FE_DOCUMENT.md — Section 9*

---

## 1. Cấu trúc Module

Mỗi module tuân theo cấu trúc chuẩn:

```
modules/<name>/
├── <name>.module.ts        # Module definition
├── <name>.controller.ts    # HTTP endpoints
├── <name>.service.ts       # Business logic
└── dto/
    ├── create-<name>.dto.ts
    ├── update-<name>.dto.ts
    └── query-<name>.dto.ts
```

---

## 2. Ví dụ: Tạo Module "reviews" (Đánh giá)

### Bước 1: Tạo DTO

```typescript
// backend/src/modules/reviews/dto/create-review.dto.ts
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  companyId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
```

### Bước 2: Tạo Service

```typescript
// backend/src/modules/reviews/reviews.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    return this.prisma.review.create({
      data: { ...dto, userId },
    });
  }

  async findByCompany(companyId: string) {
    return this.prisma.review.findMany({
      where: { companyId },
      include: { user: { select: { id: true, name: true } } },
    });
  }
}
```

### Bước 3: Tạo Controller

```typescript
// backend/src/modules/reviews/reviews.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles('CANDIDATE')
  create(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.user.id, dto);
  }

  @Get('company/:companyId')
  findByCompany(@Param('companyId') companyId: string) {
    return this.reviewsService.findByCompany(companyId);
  }
}
```

### Bước 4: Tạo Module

```typescript
// backend/src/modules/reviews/reviews.module.ts
import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
```

### Bước 5: Register vào AppModule

```typescript
// backend/src/app.module.ts
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [
    // ... existing modules
    ReviewsModule,
  ],
})
export class AppModule {}
```

---

## 3. Quy tắc Cross-Module Communication

### ✅ Đúng: Dùng SharedModule Contracts

```typescript
// Cần query data từ module khác → dùng contract
import { JobContractService } from '../shared/contracts/job.contract';

@Injectable()
export class CategoriesService {
  constructor(private readonly jobContract: JobContractService) {}

  async remove(id: string) {
    const jobCount = await this.jobContract.countByCategoryId(id);
    if (jobCount > 0) throw new ConflictException('Has jobs');
    // ...
  }
}
```

### ✅ Đúng: Dùng Inngest cho async events

```typescript
// Cần trigger hành động ở module khác → dùng Inngest
import { InngestService } from '../../inngest/inngest.service';

@Injectable()
export class ApplicationsService {
  constructor(private readonly inngest: InngestService) {}

  async create(userId: string, dto: CreateApplicationDto) {
    const app = await this.prisma.jobApplication.create({...});
    
    // Trigger notification ở module khác
    await this.inngest.send({
      name: 'application.created',
      data: { applicationId: app.id, jobId: app.jobId },
    });
    
    return app;
  }
}
```

### ✅ Đúng: Audit write qua contract chung

```typescript
// Module nghiệp vụ chỉ ghi audit qua shared contract
import { AuditWriteContractService } from '../shared/contracts/audit.contract';

@Injectable()
export class JobsService {
  constructor(private readonly auditWriteContract: AuditWriteContractService) {}
}
```

`AuditModule` chỉ giữ phần đọc log/admin view; write path đi qua `SharedModule`.

### ❌ Sai: Import trực tiếp module khác

```typescript
// KHÔNG được phép
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class ApplicationsService {
  constructor(private readonly jobsService: JobsService) {} // ❌ VI PHẠM
}
```

---

## 4. Thêm Contract mới vào SharedModule

Nếu module khác cần query data từ module mới:

```typescript
// backend/src/modules/shared/contracts/review.contract.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ReviewContractService {
  constructor(private readonly prisma: PrismaService) {}

  async countByCompanyId(companyId: string): Promise<number> {
    return this.prisma.review.count({ where: { companyId } });
  }

  async getAverageRating(companyId: string): Promise<number> {
    const result = await this.prisma.review.aggregate({
      where: { companyId },
      _avg: { rating: true },
    });
    return result._avg.rating || 0;
  }
}
```

```typescript
// backend/src/modules/shared/shared.module.ts
import { ReviewContractService } from './contracts/review.contract';

@Global()
@Module({
  providers: [
    // ... existing contracts
    ReviewContractService,
  ],
  exports: [
    // ... existing exports
    ReviewContractService,
  ],
})
export class SharedModule {}
```

---

## 5. Thêm Inngest Event mới

```typescript
// backend/src/inngest/events.types.ts
export const events = {
  // ... existing events
  'review.created': {
    data: { reviewId: string, companyId: string, rating: number },
  },
};
```

```typescript
// backend/src/inngest/functions/notification.functions.ts
export function createReviewNotificationFunctions(prisma: PrismaClient) {
  return [
    inngest.createFunction(
      { id: 'on-review-created' },
      { event: 'review.created' },
      async ({ event }) => {
        // Send notification to company owner
        const company = await prisma.company.findUnique({
          where: { id: event.data.companyId },
          select: { ownerId: true, name: true },
        });
        
        if (company) {
          await prisma.notification.create({
            data: {
              userId: company.ownerId,
              type: 'SYSTEM',
              title: 'Đánh giá mới',
              content: `Công ty ${company.name} nhận được đánh giá ${event.data.rating}⭐`,
              refId: event.data.reviewId,
              refType: 'review',
            },
          });
        }
      },
    ),
  ];
}
```

---

## 6. Checklist khi tạo Module mới

- [ ] Tạo DTO với `class-validator` decorators
- [ ] Tạo Service với PrismaService injection
- [ ] Tạo Controller với `@Controller`, `@Roles`, `@CurrentUser` decorators
- [ ] Tạo Module và export Service
- [ ] Register vào `app.module.ts`
- [ ] Nếu cần cross-module query → thêm Contract vào SharedModule
- [ ] Nếu cần async event → thêm Inngest event
- [ ] Nếu cần cache → dùng CacheService (@Global)
- [ ] Chạy `pnpm test` để verify
- [ ] Chạy `npx tsc --noEmit` để check type
