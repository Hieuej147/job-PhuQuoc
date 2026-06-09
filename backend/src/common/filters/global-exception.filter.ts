import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import pino from 'pino';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private logger: pino.Logger;

  constructor() {
    const isDev = process.env.NODE_ENV !== 'production';
    this.logger = pino({
      level: isDev ? 'debug' : 'info',
      transport: isDev
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' } }
        : undefined,
    });
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : String((res as Record<string, unknown>).message || message);
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error({ context: 'GlobalExceptionFilter', trace: exception.stack }, `${request.method} ${request.url} - ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
