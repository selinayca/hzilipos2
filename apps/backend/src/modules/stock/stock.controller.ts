import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../database/entities/tenant.entity';
import { UserRole } from '../../database/entities/user.entity';

class AdjustStockDto {
  @IsInt()
  delta: number; // positive = receive stock, negative = manual deduction
}

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('low')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'List products that are below their low-stock threshold' })
  getLowStock(@CurrentTenant() tenant: Tenant) {
    return this.stockService.getLowStock(tenant.id);
  }

  @Patch(':productId/adjust')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Manually adjust stock quantity (positive or negative delta)' })
  adjust(
    @CurrentTenant() tenant: Tenant,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.stockService.adjust(tenant.id, productId, dto.delta);
  }
}
