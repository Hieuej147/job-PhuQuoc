import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { PrismaModule } from "./prisma/prisma.module";
import { CacheModule } from "./common/cache/cache.module";
import { LoggerModule } from "./common/logger/logger.module";
import { SharedModule } from "./modules/shared/shared.module";
import { CustomAuthModule } from "./auth/auth.module";
import { auth } from "./auth/auth";
import { InngestModule } from "./inngest/inngest.module";
import { RealtimeModule } from "./realtime/realtime.module";

import { UsersModule } from "./modules/users/users.module";
import { CompaniesModule } from "./modules/companies/companies.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { AddressModule } from "./modules/address/address.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { ApplicationsModule } from "./modules/applications/applications.module";
import { ResumesModule } from "./modules/resumes/resumes.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { BlogsModule } from "./modules/blogs/blogs.module";
import { BlogCategoriesModule } from "./modules/blog-categories/blog-categories.module";
import { SavedModule } from "./modules/saved/saved.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { AuditModule } from "./modules/audit/audit.module";
import { UploadModule } from "./modules/upload/upload.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { QuotaModule } from "./common/quota/quota.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
    }),
    PrismaModule,
    CacheModule,
    LoggerModule,
    SharedModule,
    InngestModule,
    RealtimeModule,
    CustomAuthModule,
    UsersModule,
    CompaniesModule,
    CategoriesModule,
    AddressModule,
    JobsModule,
    ApplicationsModule,
    ResumesModule,
    NotificationsModule,
    BlogsModule,
    BlogCategoriesModule,
    SavedModule,
    PricingModule,
    PaymentsModule,
    AuditModule,
    UploadModule,
    DashboardModule,
    QuotaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
