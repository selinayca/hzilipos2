import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../../database/entities/tenant.entity';
import { CashRegisterService } from './cash-register.service';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { UpdateCashRegisterDto } from './dto/update-cash-register.dto';

@ApiTags('Definitions — Cash Registers') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('definitions/cash-registers')
export class CashRegisterController {
  constructor(private readonly svc: CashRegisterService) {}
  @Get()    list(@CurrentTenant() t: Tenant) { return this.svc.findAll(t.id); }
  @Get(':id') get(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(t.id, id); }
  @Post()   create(@CurrentTenant() t: Tenant, @Body() dto: CreateCashRegisterDto) { return this.svc.create(t.id, dto); }
  @Patch(':id') update(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCashRegisterDto) { return this.svc.update(t.id, id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(t.id, id); }
}
