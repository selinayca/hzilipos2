import { IsString, IsOptional, IsUUID, IsArray, IsInt, Min, ValidateNested, IsDateString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PriceChangeLineDto {
  @ApiPropertyOptional() @IsUUID() @IsOptional() productId?: string;
  @ApiProperty() @IsString() @Length(1, 255) productName: string;
  @ApiPropertyOptional() @IsString() @IsOptional() productBarcode?: string;
  @ApiProperty() @IsInt() @Min(0) oldPriceCents: number;
  @ApiProperty() @IsInt() @Min(0) newPriceCents: number;
  @ApiPropertyOptional() @IsInt() @Min(0) @IsOptional() purchasePriceCents?: number;
  @ApiPropertyOptional() @IsInt() @Min(0) @IsOptional() taxRateBps?: number;
}

export class CreatePriceChangeDto {
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() personnelName?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() occurredAt?: string;
  @ApiProperty({ type: [PriceChangeLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => PriceChangeLineDto)
  lines: PriceChangeLineDto[];
}
