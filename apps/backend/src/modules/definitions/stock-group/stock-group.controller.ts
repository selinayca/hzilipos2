import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../../database/entities/tenant.entity';
import { StockGroupService } from './stock-group.service';
import { CreateStockGroupDto } from './dto/create-stock-group.dto';
import { UpdateStockGroupDto } from './dto/update-stock-group.dto';

@ApiTags('Definitions — Stock Groups') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('definitions/stock-groups')
export class StockGroupController {
  constructor(private readonly svc: StockGroupService) {}
  @Get()    list(@CurrentTenant() t: Tenant) { return this.svc.findAll(t.id); }
  @Get(':id') get(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(t.id, id); }
  @Post()   create(@CurrentTenant() t: Tenant, @Body() dto: CreateStockGroupDto) { return this.svc.create(t.id, dto); }
  @Patch(':id') update(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStockGroupDto) { return this.svc.update(t.id, id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(t.id, id); }
}
