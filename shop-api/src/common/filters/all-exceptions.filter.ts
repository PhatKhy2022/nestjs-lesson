import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

// The complaints desk: every error leaves the building in the same shape.
@Catch() // no argument = catch everything
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' }; // never leak stack traces or SQL to clients

    if (status >= 500) {
      this.logger.error(exception); // full details only in the server log
    }

    res.status(status).json({
      ...(typeof body === 'string' ? { message: body } : body),
      statusCode: status,
      path: req.originalUrl,
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    });
  }
}
