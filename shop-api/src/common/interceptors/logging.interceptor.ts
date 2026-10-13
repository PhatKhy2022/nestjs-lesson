import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

// Wraps every handler: notes which staff member handled the request and how long it took.
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Timing');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${handler} ✓ ${Date.now() - start}ms`),
        error: (err: Error) => this.logger.warn(`${handler} ✗ ${err.message}`),
      }),
    );
  }
}
