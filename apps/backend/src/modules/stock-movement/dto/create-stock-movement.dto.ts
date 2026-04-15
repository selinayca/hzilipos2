import { IsString, IsEnum, IsOptional, IsUUID, IsArray, IsInt, Min, ValidateNested, IsDateString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../../../database/entities/stock-movement.entity';

export class StockMovementLineDto {
  @ApiPropertyOptional() @IsUUID() @IsOptional() productId?: string;
  @ApiProperty() @IsString() @Length(1, 255) productName: string;
  @ApiPropertyOptional() @IsString() @IsOptional() productBarcode?: string;
  @ApiProperty() @IsInt() @Min(1) quantity: number;
  @ApiPropertyOptional() @IsInt() @Min(0) @IsOptional() unitPriceCents?: number;
  @ApiPropertyOptional() @IsInt() @Min(0) @IsOptional() taxRateBps?: number;
  @ApiPropertyOptional() @IsInt() @IsOptional() sortOrder?: number;
}

export class CreateStockMovementDto {
  @ApiProperty({ enum: MovementType }) @IsEnum(MovementType) movementType: MovementType;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() inWarehouseId?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() outWarehouseId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() personnelName?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() occurredAt?: string;
  @ApiProperty({ type: [StockMovementLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => StockMovementLineDto)
  lines: StockMovementLineDto[];
}
