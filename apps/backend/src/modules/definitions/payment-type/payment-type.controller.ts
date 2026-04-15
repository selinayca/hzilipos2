import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../../database/entities/tenant.entity';
import { PaymentTypeService } from './payment-type.service';
import { CreatePaymentTypeDto } from './dto/create-payment-type.dto';
import { UpdatePaymentTypeDto } from './dto/update-payment-type.dto';

@ApiTags('Definitions — Payment Types') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('definitions/payment-types')
export class PaymentTypeController {
  constructor(private readonly svc: PaymentTypeService) {}
  @Get()    list(@CurrentTenant() t: Tenant) { return this.svc.findAll(t.id); }
  @Get(':id') get(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(t.id, id); }
  @Post()   create(@CurrentTenant() t: Tenant, @Body() dto: CreatePaymentTypeDto) { return this.svc.create(t.id, dto); }
  @Patch(':id') update(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePaymentTypeDto) { return this.svc.update(t.id, id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(t.id, id); }
}
