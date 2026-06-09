import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import * as cookieParser from 'cookie-parser';
import { serve } from 'inngest/express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { inngest, createAllFunctions } from './inngest/client';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
  });

  app.use(cookieParser());

  // Enable raw body for Stripe webhook signature verification
  app.useBodyParser('json', { limit: '10mb', verify: (req: any, _res: any, buf: any) => {
    req.rawBody = buf;
  }});

  // Create Inngest functions with PrismaService
  const prisma = app.get(PrismaService);
  const functions = createAllFunctions(prisma);

  // Mount Inngest handler at /api/inngest
  app.use(
    '/api/inngest',
    serve({
      client: inngest,
      functions,
    }),
  );

  app.setGlobalPrefix('api/v1', {
    exclude: ['api/auth/(.*)', 'api/inngest'],
  });

  // Swagger/OpenAPI config
  const config = new DocumentBuilder()
    .setTitle('Phú Quốc Jobs API')
    .setDescription('Backend API cho website tìm việc làm tại Phú Quốc')
    .setVersion('1.0')
    .addCookieAuth('better-auth.session_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'better-auth.session_token',
      description: 'Session cookie từ better-auth',
    })
    .addTag('Auth', 'Xác thực & phân quyền')
    .addTag('Users', 'Quản lý người dùng (ADMIN)')
    .addTag('Companies', 'Quản lý công ty')
    .addTag('Jobs', 'Tin tuyển dụng')
    .addTag('Applications', 'Ứng tuyển')
    .addTag('Resumes', 'Hồ sơ CV')
    .addTag('Notifications', 'Thông báo')
    .addTag('Categories', 'Danh mục nghề')
    .addTag('Address', 'Địa chỉ')
    .addTag('Blogs', 'Bài viết')
    .addTag('Blog Categories', 'Danh mục blog')
    .addTag('Saved', 'Đã lưu')
    .addTag('Pricing', 'Gói đăng tin')
    .addTag('Payments', 'Thanh toán')
    .addTag('Audit', 'Nhật ký hệ thống')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Scalar API Reference
  app.use(
    '/docs',
    apiReference({
      content: document,
      theme: 'purple',
      layout: 'modern',
      showSidebar: true,
      hideDownloadButton: false,
      searchHotkey: 'k',
      customCss: `.scalar-app { font-family: 'Inter', sans-serif; }`,
      authentication: {
        preferredSecurityScheme: 'better-auth.session_token',
      },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`API Docs (Scalar): http://localhost:${port}/docs`);
}
bootstrap();
