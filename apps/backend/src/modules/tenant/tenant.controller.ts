import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../database/entities/tenant.entity';
import { UserRole } from '../../database/entities/user.entity';

@ApiTags('Tenant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('settings')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get current tenant settings & configuration' })
  getSettings(@CurrentTenant() tenant: Tenant) {
    return this.tenantService.getSettings(tenant.id);
  }

  @Patch('settings')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update tenant name, logo, and configuration' })
  updateSettings(
    @CurrentTenant() tenant: Tenant,
    @Body()
    body: Partial<{
      name: string;
      logoUrl: string;
      settings: Record<string, unknown>;
    }>,
  ) {
    return this.tenantService.updateSettings(tenant.id, body);
  }
}
