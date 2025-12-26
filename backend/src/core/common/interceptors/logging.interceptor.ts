import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Logging Interceptor
 * - Logs all HTTP requests and responses
 * - Tracks request duration
 * - Logs user information for authenticated requests
 * - Logs errors with context
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, url, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';

    // Get client IP (handle proxies)
    const clientIp = this.getClientIp(request);

    // Start timer
    const startTime = Date.now();

    // Log incoming request (user not yet available - JWT guard hasn't run)
    this.logger.log(
      `Incoming Request: ${method} ${url} - IP: ${clientIp}`,
    );

    return next.handle().pipe(
      tap(() => {
        // Calculate duration
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Get user AFTER guards have run (request.user is now populated)
        const user = (request as any).user;
        const userId = user?.userId || user?.id || 'anonymous';

        // Log successful response
        this.logger.log(
          `${method} ${url} ${statusCode} ${duration}ms - IP: ${clientIp} - User: ${userId} - Agent: ${this.truncate(userAgent, 50)}`,
        );

        // Log slow requests (> 1 second)
        if (duration > 1000) {
          this.logger.warn(
            `Slow Request Detected: ${method} ${url} took ${duration}ms`,
          );
        }
      }),
      catchError((error) => {
        // Calculate duration
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Get user AFTER guards have run
        const user = (request as any).user;
        const userId = user?.userId || user?.id || 'anonymous';

        // Log error
        this.logger.error(
          `${method} ${url} ${statusCode} ${duration}ms - IP: ${clientIp} - User: ${userId} - Error: ${error.message}`,
          error.stack,
        );

        // Re-throw error to be handled by exception filter
        throw error;
      }),
    );
  }

  /**
   * Get client IP address (handle proxies and load balancers)
   */
  private getClientIp(request: Request): string {
    // Check X-Forwarded-For header (added by proxies)
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }

    // Check X-Real-IP header
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return realIp as string;
    }

    // Fall back to direct connection IP
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }

  /**
   * Truncate string to specified length
   */
  private truncate(str: string, maxLength: number): string {
    if (!str || str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength) + '...';
  }
}
