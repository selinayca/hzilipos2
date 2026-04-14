import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Tenant } from '../../database/entities/tenant.entity';
import { UserRole } from '../../database/entities/user.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword: string;
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT_ADMIN)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List all staff for this tenant' })
  findAll(@CurrentTenant() tenant: Tenant) {
    return this.userService.findAll(tenant.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new staff member (cashier or admin)' })
  create(@CurrentTenant() tenant: Tenant, @Body() dto: CreateUserDto) {
    return this.userService.create(tenant.id, dto);
  }

  @Patch(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable or disable a staff account' })
  toggleActive(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() requester: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.userService.toggleActive(tenant.id, id, requester.sub);
  }

  @Patch(':id/reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset a staff member password (admin only)' })
  resetPassword(
    @CurrentTenant() tenant: Tenant,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.userService.resetPassword(tenant.id, id, dto.newPassword);
  }
}
