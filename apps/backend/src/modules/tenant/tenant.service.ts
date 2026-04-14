import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../database/entities/tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  findBySlug(slug: string): Promise<Tenant | null> {
    return this.repo.findOne({ where: { slug, isActive: true } });
  }

  findById(id: string): Promise<Tenant | null> {
    return this.repo.findOne({ where: { id } });
  }

  async getSettings(tenantId: string) {
    const tenant = await this.repo.findOne({
      where: { id: tenantId },
      select: ['id', 'slug', 'name', 'logoUrl', 'planTier', 'settings'],
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateSettings(
    tenantId: string,
    patch: Partial<{ name: string; logoUrl: string; settings: Record<string, unknown> }>,
  ) {
    const tenant = await this.repo.findOneOrFail({ where: { id: tenantId } });
    if (patch.name) tenant.name = patch.name;
    if (patch.logoUrl !== undefined) tenant.logoUrl = patch.logoUrl;
    if (patch.settings) {
      tenant.settings = { ...tenant.settings, ...patch.settings };
    }
    return this.repo.save(tenant);
  }
}
