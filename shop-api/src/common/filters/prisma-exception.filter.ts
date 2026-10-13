import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '../../generated/prisma/client.js';

// Translates known database errors into proper HTTP answers instead of a generic 500.
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const req = ctx.getRequest<FastifyRequest>();

    const [status, message] = this.toHttp(exception);
    reply.status(status).send({
      statusCode: status,
      message,
      prismaCode: exception.code,
      path: req.url,
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    });
  }

  private toHttp(e: Prisma.PrismaClientKnownRequestError): [number, string] {
    switch (e.code) {
      case 'P2002': // unique constraint failed
        return [HttpStatus.CONFLICT, 'A record with this value already exists'];
      case 'P2025': // record to update/delete not found
        return [HttpStatus.NOT_FOUND, 'Record not found'];
      case 'P2003': // foreign key constraint failed
        return [
          HttpStatus.BAD_REQUEST,
          'This record is still used by another record',
        ];
      default:
        return [HttpStatus.INTERNAL_SERVER_ERROR, 'Database error'];
    }
  }
}
