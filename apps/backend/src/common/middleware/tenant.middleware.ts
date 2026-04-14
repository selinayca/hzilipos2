import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../database/entities/tenant.entity';

/**
 * TenantMiddleware
 *
 * Resolves the current tenant on every request using one of two strategies
 * (checked in order):
 *   1. X-Tenant-ID header    → used by internal/backoffice calls
 *   2. Subdomain extraction  → {slug}.example.com for POS clients
 *
 * On success, attaches `tenant` to the Express request object so that
 * guards, services, and interceptors downstream can access it without
 * re-querying the database.
 *
 * The resolved tenant object is cached in Redis via TenantService (TODO).
 * Current implementation queries PG directly — acceptable for MVP.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);
  private readonly appDomain = process.env.APP_DOMAIN ?? 'example.com';

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;

    if (tenantId) {
      // Fast path: explicit header (backoffice, internal services)
      const tenant = await this.tenantRepo.findOne({
        where: { id: tenantId, isActive: true },
        select: ['id', 'slug', 'name', 'planTier'],
      });
      if (!tenant) throw new NotFoundException('Tenant not found');
      req['tenant'] = tenant;
      return next();
    }

    // Subdomain path: extract from Host header
    const host = (req.headers['x-forwarded-host'] as string) ?? req.hostname;
    const slug = this.extractSubdomain(host);

    if (!slug) {
      // Request arrived on the root domain — probably the backoffice itself.
      // Let it through without a tenant; controllers that require one will
      // throw via the @CurrentTenant() decorator.
      return next();
    }

    const tenant = await this.tenantRepo.findOne({
      where: { slug, isActive: true },
      select: ['id', 'slug', 'name', 'planTier'],
    });

    if (!tenant) {
      this.logger.warn(`Tenant not found for slug: ${slug}`);
      throw new NotFoundException(`Tenant "${slug}" not found`);
    }

    req['tenant'] = tenant;
    next();
  }

  private extractSubdomain(host: string): string | null {
    // Strip port
    const hostname = host.split(':')[0];
    // e.g.  acme.example.com  →  ['acme', 'example', 'com']
    const parts = hostname.split('.');
    // Need at least 3 parts to have a subdomain
    if (parts.length < 3) return null;
    const subdomain = parts[0];
    // Don't treat 'www' or 'app' or 'api' as tenant slugs
    if (['www', 'app', 'api'].includes(subdomain)) return null;
    return subdomain;
  }
}
