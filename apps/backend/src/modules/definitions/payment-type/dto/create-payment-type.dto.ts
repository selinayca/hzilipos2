import { IsString, IsBoolean, IsOptional, IsInt, IsUUID, Min, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentTypeDto {
  @ApiProperty({ example: 'KART' }) @IsString() @Length(1, 50) code: string;
  @ApiProperty({ example: 'Kredi Kartı' }) @IsString() @Length(1, 100) name: string;
  @ApiPropertyOptional({ example: 179, description: 'Commission in bps (179 = 1.79%)' })
  @IsInt() @Min(0) @IsOptional() commissionBps?: number;
  @ApiPropertyOptional() @IsUUID() @IsOptional() cashRegisterId?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
  @ApiPropertyOptional() @IsInt() @IsOptional() sortOrder?: number;
}
