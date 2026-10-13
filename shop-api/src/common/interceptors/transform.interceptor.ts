import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

// The mailroom: every successful answer goes out in the same envelope { data, timestamp }.
// Errors don't pass through here; exception filters shape those.
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next
      .handle()
      .pipe(map((data) => ({ data, timestamp: new Date().toISOString() })));
  }
}
