import { IsString, IsOptional, MaxLength, IsInt, Min, Matches, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShortcutGroupItemDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class CreateShortcutGroupDto {
  @ApiProperty()
  @IsString() @MaxLength(100) name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(7)
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'colorHex must be a valid hex color like #FF5733' })
  colorHex?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;

  @ApiPropertyOptional({ type: [ShortcutGroupItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShortcutGroupItemDto)
  items?: ShortcutGroupItemDto[];
}
