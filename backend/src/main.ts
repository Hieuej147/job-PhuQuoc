import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { IoAdapter } from "@nestjs/platform-socket.io";
import type { ServerOptions } from "socket.io";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import * as cookieParser from "cookie-parser";
import { serve } from "inngest/express";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor";
import { inngest, createAllFunctions } from "./inngest/client";
import { PrismaService } from "./prisma/prisma.service";
import { RealtimeService } from "./realtime/realtime.service";

/**
 * NestJS + Socket.IO CHỈ hỗ trợ 1 cấu hình CORS DUY NHẤT ở cấp server gốc
 * (root `Server` instance), dùng chung cho MỌI namespace — không có CORS
 * riêng theo từng namespace. Cấu hình `cors` đặt trong
 * `@WebSocketGateway({ namespace: '/realtime', cors: {...} })` (xem
 * realtime.gateway.ts) KHÔNG đáng tin cậy để tự áp dụng lên server gốc khi
 * gateway có namespace — đây là vấn đề đã biết của NestJS + Socket.IO
 * (nestjs/nest issue #12559: thêm namespace vào là CORS ngừng hoạt động).
 *
 * Triệu chứng đúng bug này: gọi thẳng http://localhost:3006/socket.io/...
 * qua thanh địa chỉ trình duyệt (navigation, không bị CORS chi phối) thì
 * server trả lời bình thường — nhưng cùng URL đó gọi từ code JS trong trang
 * (XHR polling của socket.io-client, có Origin khác) lại bị chặn.
 *
 * Cách sửa chuẩn: ép CORS ở cấp IoAdapter khi tạo server Socket.IO gốc,
 * không phụ thuộc vào cấu hình cors riêng lẻ của từng @WebSocketGateway.
 */
class CorsIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    const corsOptions = {
      origin: process.env.FRONTEND_URL || "http://localhost:3001",
      credentials: true,
    };
    return super.createIOServer(port, { ...options, cors: corsOptions });
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
  });
  //@ts-ignore
  app.use(cookieParser());

  app.useBodyParser("json", { limit: "10mb" });

  // Ép CORS đúng ở cấp server Socket.IO gốc — xem giải thích chi tiết ở
  // class CorsIoAdapter phía trên. Đặt trước app.listen().
  app.useWebSocketAdapter(new CorsIoAdapter(app));

  // Create Inngest functions with PrismaService
  const prisma = app.get(PrismaService);
  const realtime = app.get(RealtimeService);
  const functions = createAllFunctions(prisma, realtime);

  // Mount Inngest handler at /api/inngest
  app.use(
    "/api/inngest",
    serve({
      client: inngest,
      functions,
    }),
  );
  // import { VersioningType } from "@nestjs/common"; in the furture if tou want to use versioning
  app.setGlobalPrefix("api/v1", {
    exclude: ["api/auth/(.*)", "api/inngest"],
  });

  // OpenAPI config for Scalar API docs
  const config = new DocumentBuilder()
    .setTitle("Phú Quốc Jobs API")
    .setDescription("Backend API cho website tìm việc làm tại Phú Quốc")
    .setVersion("1.0")
    .addCookieAuth("better-auth.session_token", {
      type: "apiKey",
      in: "cookie",
      name: "better-auth.session_token",
      description: "Session cookie từ better-auth",
    })
    .addTag("Auth", "Xác thực & phân quyền")
    .addTag("Users", "Quản lý người dùng (ADMIN)")
    .addTag("Companies", "Quản lý công ty")
    .addTag("Jobs", "Tin tuyển dụng")
    .addTag("Applications", "Ứng tuyển")
    .addTag("Resumes", "Hồ sơ CV")
    .addTag("Notifications", "Thông báo")
    .addTag("Categories", "Danh mục nghề")
    .addTag("Address", "Địa chỉ")
    .addTag("Blogs", "Bài viết")
    .addTag("Blog Categories", "Danh mục blog")
    .addTag("Saved", "Đã lưu")
    .addTag("Pricing", "Gói đăng tin")
    .addTag("Payments", "Thanh toán")
    .addTag("Audit", "Nhật ký hệ thống")
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  // Scalar API Reference
  app.use(
    "/docs",
    apiReference({
      content: document,
      theme: "purple",
      layout: "modern",
      showSidebar: true,
      hideDownloadButton: false,
      searchHotKey: "k",
      customCss: `.scalar-app { font-family: 'Inter', sans-serif; }`,
      authentication: {
        preferredSecurityScheme: "better-auth.session_token",
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
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
  });

  const port = process.env.PORT || 3006;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`API Docs (Scalar): http://localhost:${port}/docs`);
}
bootstrap();
