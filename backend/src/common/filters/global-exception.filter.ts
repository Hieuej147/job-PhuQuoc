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
    let errorPayload: Record<string, unknown> = {
      message: 'Internal server error',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        errorPayload = { message: res };
      } else {
        errorPayload = { ...(res as Record<string, unknown>) };
      }
    } else if (exception instanceof Error) {
      errorPayload = { message: exception.message };
      this.logger.error({ context: 'GlobalExceptionFilter', trace: exception.stack }, `${request.method} ${request.url} - ${exception.message}`);
    }

    const message = this.normalizeMessage(errorPayload.message ?? errorPayload.error ?? 'Request failed');
    const details = { ...errorPayload };
    delete details.statusCode;
    delete details.message;
    delete details.error;
    delete details.code;
    const error = errorPayload.error;
    const code = errorPayload.code;
    const hasDetails = Object.keys(details).length > 0;

    response.status(status).json({
      statusCode: status,
      message,
      ...(typeof error === 'string' ? { error } : {}),
      ...(typeof code === 'string' ? { code } : {}),
      ...(hasDetails ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private normalizeMessage(message: unknown) {
    if (Array.isArray(message)) return message[0] ?? 'Request failed';
    if (typeof message === 'string') return message;
    return 'Request failed';
  }
}
