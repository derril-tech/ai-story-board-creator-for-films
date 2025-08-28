import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { TelemetryService } from '../telemetry/telemetry.service';
import { SpanKind } from '@opentelemetry/api';

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  constructor(private telemetryService: TelemetryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const url = request.url;
    const startTime = Date.now();

    // Create span for the request
    const span = this.telemetryService.createSpan(`${method} ${url}`, SpanKind.SERVER);
    
    // Add request attributes to span
    span.setAttribute('http.method', method);
    span.setAttribute('http.url', url);
    span.setAttribute('http.request_id', request.headers['x-request-id'] || 'unknown');
    span.setAttribute('http.user_agent', request.headers['user-agent'] || 'unknown');

    return next.handle().pipe(
      tap((data) => {
        const duration = (Date.now() - startTime) / 1000;
        const statusCode = response.statusCode || HttpStatus.OK;

        // Record metrics
        this.telemetryService.recordRequest(method, url, statusCode, duration);

        // Update span
        span.setAttribute('http.status_code', statusCode);
        span.setAttribute('http.response_size', JSON.stringify(data).length);
        span.setStatus({ code: 1 }); // OK
        span.end();
      }),
      catchError((error) => {
        const duration = (Date.now() - startTime) / 1000;
        const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const errorType = error.constructor.name;

        // Record error metrics
        this.telemetryService.recordError(method, url, errorType);

        // Update span with error information
        span.setAttribute('http.status_code', statusCode);
        span.setAttribute('error.type', errorType);
        span.setAttribute('error.message', error.message);
        span.setStatus({ code: 2, message: error.message }); // ERROR
        span.recordException(error);
        span.end();

        return throwError(() => error);
      }),
    );
  }
}
