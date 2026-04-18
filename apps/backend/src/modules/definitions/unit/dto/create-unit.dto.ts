import { IsString, IsBoolean, IsOptional, IsInt, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateUnitDto {
  @ApiProperty({ example: 'ADET' }) @IsString() @Length(1, 20) code: string;
  @ApiProperty({ example: 'Adet' }) @IsString() @Length(1, 100) name: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
  @ApiPropertyOptional() @IsInt() @IsOptional() sortOrder?: number;
}
