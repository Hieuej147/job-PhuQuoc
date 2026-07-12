import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import pino from 'pino';

type ErrorPayload = Record<string, unknown>;

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  error?: string;
  code?: string;
  details?: ErrorPayload;
  timestamp: string;
  path: string;
}

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

    const { status, body } = this.buildHttpErrorResponse(exception, request);
    response.status(status).json(body);
  }

  private buildHttpErrorResponse(exception: unknown, request: Request): { status: number; body: ErrorResponseBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = this.extractHttpExceptionPayload(exception);
      return {
        status,
        body: this.buildResponseBody(status, payload, request.url),
      };
    }

    this.logInternalException(exception, request);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: this.buildResponseBody(
        HttpStatus.INTERNAL_SERVER_ERROR,
        { message: 'Internal server error' },
        request.url,
      ),
    };
  }

  private extractHttpExceptionPayload(exception: HttpException): ErrorPayload {
    const response = exception.getResponse();
    if (typeof response === 'string') return { message: response };
    if (response && typeof response === 'object') return { ...(response as ErrorPayload) };
    return { message: 'Request failed' };
  }

  private buildResponseBody(status: number, payload: ErrorPayload, path: string): ErrorResponseBody {
    const message = this.normalizeMessage(payload.message ?? payload.error ?? 'Request failed');
    const details = this.extractSafeDetails(payload);
    const error = payload.error;
    const code = payload.code;

    return {
      statusCode: status,
      message,
      ...(typeof error === 'string' ? { error } : {}),
      ...(typeof code === 'string' ? { code } : {}),
      ...(Object.keys(details).length > 0 ? { details } : {}),
      timestamp: new Date().toISOString(),
      path,
    };
  }

  private extractSafeDetails(payload: ErrorPayload): ErrorPayload {
    const details = { ...payload };
    delete details.statusCode;
    delete details.message;
    delete details.error;
    delete details.code;
    return details;
  }

  private logInternalException(exception: unknown, request: Request) {
    if (exception instanceof Error) {
      this.logger.error(
        { context: 'GlobalExceptionFilter', trace: exception.stack },
        `${request.method} ${request.url} - ${exception.message}`,
      );
      return;
    }

    this.logger.error(
      { context: 'GlobalExceptionFilter', exception },
      `${request.method} ${request.url} - Unknown internal exception`,
    );
  }

  private normalizeMessage(message: unknown) {
    if (Array.isArray(message)) return message[0] ?? 'Request failed';
    if (typeof message === 'string') return message;
    return 'Request failed';
  }
}
