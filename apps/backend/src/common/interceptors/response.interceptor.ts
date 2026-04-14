import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  meta?: Record<string, unknown>;
}

/**
 * ResponseInterceptor
 *
 * Wraps every successful response in a consistent envelope:
 *   { success: true, data: <payload>, meta?: {...} }
 *
 * Preserves HttpExceptions as-is (NestJS default error filter handles those).
 * This keeps the response shape predictable for frontend clients.
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: data ?? null,
      })),
      catchError((err) => {
        // Re-throw HttpExceptions — NestJS exception filters handle these
        if (err instanceof HttpException) return throwError(() => err);
        // Unknown errors become 500
        return throwError(
          () =>
            new HttpException(
              { success: false, data: null, message: 'Internal server error' },
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
      }),
    );
  }
}
