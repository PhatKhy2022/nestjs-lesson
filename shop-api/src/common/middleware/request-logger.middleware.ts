import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

// Class middleware: writes one log line per request once the response has been sent.
// On Fastify, Nest middleware gets the raw Node.js request/response (not Fastify's wrappers).
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(
    req: FastifyRequest['raw'] & { originalUrl?: string },
    res: FastifyReply['raw'],
    next: () => void,
  ) {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      this.logger.log(
        `${req.method} ${req.originalUrl ?? req.url} ${res.statusCode} - ${ms}ms`,
      );
    });
    next();
  }
}
