import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Tenant } from '../../database/entities/tenant.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a sale (supports offline-first idempotent submission)' })
  create(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.create(tenant.id, user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders with optional date range filter' })
  findAll(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.orderService.findAll(tenant.id, {
      page: Number(page),
      limit: Number(limit),
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order with line items' })
  findOne(
    @CurrentTenant() tenant: Tenant,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orderService.findOne(tenant.id, id);
  }
}
