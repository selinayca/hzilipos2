import { IsEmail, IsEnum, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../database/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'cashier@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'supersecret' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: [UserRole.TENANT_ADMIN, UserRole.CASHIER] })
  @IsEnum([UserRole.TENANT_ADMIN, UserRole.CASHIER])
  role: UserRole.TENANT_ADMIN | UserRole.CASHIER;
}
