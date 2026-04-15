import { IsString, IsBoolean, IsOptional, IsInt, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateSizeDto {
  @ApiProperty() @IsString() @Length(1, 50) code: string;
  @ApiProperty() @IsString() @Length(1, 100) name: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
  @ApiPropertyOptional() @IsInt() @IsOptional() sortOrder?: number;
}
