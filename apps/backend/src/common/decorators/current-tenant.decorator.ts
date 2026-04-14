import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Tenant } from '../../database/entities/tenant.entity';

/**
 * @CurrentTenant() — injects the resolved Tenant from the request.
 *
 * Usage:
 *   @Get()
 *   getProducts(@CurrentTenant() tenant: Tenant) { ... }
 *
 * Throws 401 if no tenant is attached (middleware not applied or public route misconfiguration).
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Tenant => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request['tenant'] as Tenant | undefined;
    if (!tenant) {
      throw new UnauthorizedException('Tenant context not resolved');
    }
    return tenant;
  },
);
