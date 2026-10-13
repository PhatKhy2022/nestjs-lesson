import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

// The complaints desk: every error leaves the building in the same shape.
@Catch() // no argument = catch everything
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const req = ctx.getRequest<FastifyRequest>();

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

    // Fastify: reply.status().send() (Express would be res.status().json())
    reply.status(status).send({
      ...(typeof body === 'string' ? { message: body } : body),
      statusCode: status,
      path: req.url, // the full path, e.g. /api/orders?page=2
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    });
  }
}
