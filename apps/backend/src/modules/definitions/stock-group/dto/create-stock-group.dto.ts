import { IsString, IsBoolean, IsOptional, IsInt, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateStockGroupDto {
  @ApiProperty() @IsString() @Length(1, 50) mainCode: string;
  @ApiProperty() @IsString() @Length(1, 100) mainName: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @Length(1, 50) subCode?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @Length(1, 100) subName?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
  @ApiPropertyOptional() @IsInt() @IsOptional() sortOrder?: number;
}
