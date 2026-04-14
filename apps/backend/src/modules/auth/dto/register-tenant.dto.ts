import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterTenantDto {
  @ApiProperty({ example: 'Acme Market' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  businessName: string;

  @ApiProperty({
    example: 'acme',
    description: 'Subdomain slug — lowercase letters, numbers, hyphens only',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(63)
  @Matches(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/, {
    message: 'slug must be 3-63 chars, lowercase alphanumeric + hyphens, not starting/ending with hyphen',
  })
  slug: string;

  @ApiProperty({ example: 'admin@acme.com' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'supersecret' })
  @IsString()
  @MinLength(8)
  adminPassword: string;

  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @MinLength(2)
  adminName: string;
}
