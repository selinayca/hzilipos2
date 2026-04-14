import {
  IsEnum,
  IsOptional,
  IsInt,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../../database/entities/order.entity';

export class OrderItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price cents at time of sale — confirmed by client for audit' })
  @IsInt()
  @Min(0)
  unitPriceCents: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountCents?: number;
}

export class CreateOrderDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountCents?: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  cashTenderedCents?: number;

  @ApiPropertyOptional({ description: 'Client-generated UUID for idempotent offline submissions' })
  @IsOptional()
  @IsUUID()
  offlineSyncId?: string;

  @ApiPropertyOptional({ description: 'Actual sale timestamp when created offline' })
  @IsOptional()
  @IsDateString()
  offlineCreatedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
