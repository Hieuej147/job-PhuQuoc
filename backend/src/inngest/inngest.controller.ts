import { Controller, Get, Post, Req, Res, OnModuleInit } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";
import { InngestService } from "./inngest.service";
import { PrismaService } from "../prisma/prisma.service";
import { PinoLoggerService } from "../common/logger/pino-logger.service";
import { serve } from "inngest/express";
import { createNotificationFunctions } from "./functions/notification.functions";
import { createWeeklySummaryFunction } from "./functions/weekly-summary.function";
import { createJobExpiryFunctions } from "./functions/job-expiry.function";
import { createUserFunctions } from "./functions/user.functions";
import { createNotificationCleanupFunction } from "./functions/notification-cleanup.function";
import { createQuotaPlanExpiryFunctions } from "./functions/quota-plan-expiry.function";
import type { Request, Response } from "express";

@Controller("inngest")
export class InngestController implements OnModuleInit {
  private handler: ((req: Request, res: Response) => Promise<void>) | null = null;

  constructor(
    private readonly inngestService: InngestService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLoggerService,
  ) {}

  async onModuleInit() {
    try {
      const client = this.inngestService.getClient();

      const functions = [
        ...createNotificationFunctions(this.prisma),
        ...createJobExpiryFunctions(this.prisma),
        ...createUserFunctions(this.prisma),
        ...createQuotaPlanExpiryFunctions(this.prisma),
        createNotificationCleanupFunction(this.prisma),
        createWeeklySummaryFunction(this.prisma),
      ];

      this.handler = serve({
        client,
        functions,
      });

      this.logger.log(`Registered ${functions.length} Inngest functions`, 'InngestController');
    } catch (error: any) {
      this.logger.warn(`Inngest controller init skipped: ${error.message}`, 'InngestController');
    }
  }

  @Get()
  @Public()
  health() {
    return { status: "ok", service: "inngest" };
  }

  @Post()
  @Public()
  async handlePost(@Req() req: Request, @Res() res: Response) {
    if (!this.handler) {
      res.status(503).json({ error: "Inngest not initialized" });
      return;
    }

    // Re-collect body since bodyParser may not have parsed it
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks);
    (req as any).body = rawBody;

    return this.handler(req, res);
  }
}
