import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma';

/**
 * Interceptor that logs all mutating operations to the AuditLog table.
 * Only intercepts POST, PUT, PATCH, DELETE requests.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only audit mutating operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = request.user;
    if (!user) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const handler = context.getHandler().name;
          const controller = context.getClass().name;

          // Derive action from handler name
          const action = `${method}_${handler}`.toUpperCase();

          // Try to extract entity info from response
          const entityId =
            responseData?.id ||
            request.params?.id ||
            request.params?.threadId ||
            request.params?.courseId ||
            'unknown';

          await this.prisma.auditLog.create({
            data: {
              actorId: user.id,
              action,
              entity: controller.replace('Controller', ''),
              entityId: String(entityId),
              meta: {
                method,
                path: request.url,
                duration: Date.now() - startTime,
                params: request.params,
              },
            },
          });
        } catch (err) {
          // Don't let audit logging failures break the request
          console.error('Audit log failed:', err);
        }
      }),
    );
  }
}
