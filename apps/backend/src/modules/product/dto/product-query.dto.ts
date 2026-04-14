import { IsOptional, IsInt, Min, Max, IsString, IsBoolean, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 50;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;

  /**
   * Sync cursor: return only products with version > sinceVersion.
   * Used by POS clients to perform incremental syncs.
   */
  @ApiPropertyOptional({ description: 'Return products updated after this version' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sinceVersion?: number;
}
