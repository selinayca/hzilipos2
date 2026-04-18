import { Controller, Get, Post, Delete, Body, Param, ParseUUIDPipe, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../database/entities/tenant.entity';
import { StockMovementService } from './stock-movement.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { QueryStockMovementDto } from './dto/query-stock-movement.dto';

@ApiTags('Stock Movements') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('stock-movements')
export class StockMovementController {
  constructor(private readonly svc: StockMovementService) {}
  @Get()      list(@CurrentTenant() t: Tenant, @Query() q: QueryStockMovementDto) { return this.svc.findAll(t.id, q); }
  @Get(':id') get(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(t.id, id); }
  @Post()     create(@CurrentTenant() t: Tenant, @Body() dto: CreateStockMovementDto) { return this.svc.create(t.id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(t.id, id); }
}
