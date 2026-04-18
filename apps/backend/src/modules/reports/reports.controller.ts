import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../database/entities/tenant.entity';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('summary')
  @ApiQuery({ name: 'from', required: false, description: 'ISO date YYYY-MM-DD (default: 30 days ago)' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date YYYY-MM-DD (default: today)' })
  getSummary(
    @CurrentTenant() t: Tenant,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
  ) {
    const to = toStr ? new Date(toStr + 'T23:59:59Z') : new Date();
    const from = fromStr
      ? new Date(fromStr + 'T00:00:00Z')
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return this.svc.getSummary(t.id, from, to);
  }
}
