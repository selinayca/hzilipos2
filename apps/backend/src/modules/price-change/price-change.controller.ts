import { Controller, Get, Post, Delete, Body, Param, ParseUUIDPipe, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../database/entities/tenant.entity';
import { PriceChangeService } from './price-change.service';
import { CreatePriceChangeDto } from './dto/create-price-change.dto';
import { QueryPriceChangeDto } from './dto/query-price-change.dto';

@ApiTags('Price Changes') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('price-changes')
export class PriceChangeController {
  constructor(private readonly svc: PriceChangeService) {}
  @Get()      list(@CurrentTenant() t: Tenant, @Query() q: QueryPriceChangeDto) { return this.svc.findAll(t.id, q); }
  @Get(':id') get(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(t.id, id); }
  @Post()     create(@CurrentTenant() t: Tenant, @Body() dto: CreatePriceChangeDto) { return this.svc.create(t.id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(t.id, id); }
}
