import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../../../database/entities/stock-movement.entity';

export class QueryStockMovementDto {
  @ApiPropertyOptional({ enum: MovementType }) @IsEnum(MovementType) @IsOptional() movementType?: MovementType;
  @ApiPropertyOptional({ default: 1 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional() page: number = 1;
  @ApiPropertyOptional({ default: 20 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional() limit: number = 20;
}
