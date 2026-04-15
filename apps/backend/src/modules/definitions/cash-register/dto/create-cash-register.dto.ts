import { IsString, IsBoolean, IsOptional, IsInt, IsEnum, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CashRegisterType } from '../../../../database/entities/cash-register.entity';

export class CreateCashRegisterDto {
  @ApiProperty() @IsString() @Length(1, 50) code: string;
  @ApiProperty() @IsString() @Length(1, 100) name: string;
  @ApiPropertyOptional({ enum: CashRegisterType, default: CashRegisterType.CASH })
  @IsEnum(CashRegisterType) @IsOptional() type?: CashRegisterType;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
  @ApiPropertyOptional() @IsInt() @IsOptional() sortOrder?: number;
}
