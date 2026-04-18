import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../../database/entities/tenant.entity';
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@ApiTags('Definitions — Units') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('definitions/units')
export class UnitController {
  constructor(private readonly svc: UnitService) {}
  @Get()    list(@CurrentTenant() t: Tenant) { return this.svc.findAll(t.id); }
  @Get(':id') get(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(t.id, id); }
  @Post()   create(@CurrentTenant() t: Tenant, @Body() dto: CreateUnitDto) { return this.svc.create(t.id, dto); }
  @Patch(':id') update(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUnitDto) { return this.svc.update(t.id, id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(t.id, id); }
}
