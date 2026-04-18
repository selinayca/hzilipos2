import { IsString, IsInt, IsBoolean, IsOptional, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVatRateDto {
  @ApiProperty({ example: 'KDV-18' }) @IsString() @Length(1, 20) code: string;
  @ApiProperty({ example: '%18 KDV' }) @IsString() @Length(1, 100) name: string;
  @ApiProperty({ example: 1800, description: 'Rate in basis points (1800 = 18%)' })
  @IsInt() @Min(0) @Max(100_000) rateBps: number;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
  @ApiPropertyOptional() @IsInt() @IsOptional() sortOrder?: number;
}
