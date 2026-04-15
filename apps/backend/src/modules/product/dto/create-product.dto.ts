import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsUUID,
  IsArray,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Coca Cola 500ml' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '8690526040027' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({ example: 'CCL-500' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @ApiProperty({ example: 1500, description: 'Price in smallest currency unit (e.g. 1500 kuruş = 15.00 TRY)' })
  @IsInt()
  @Min(0)
  priceCents: number;

  @ApiPropertyOptional({ example: 1800, description: 'Tax rate in basis points (1800 = 18%)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  taxRateBps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  initialStock?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) priceCents2?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) priceCents3?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) priceCents4?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) purchasePriceCents?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() unitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() stockGroupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() shelfId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) manufacturerName?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() extraBarcodes?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) customField1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) customField2?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) customField3?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) customField4?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) customField5?: string;
}
