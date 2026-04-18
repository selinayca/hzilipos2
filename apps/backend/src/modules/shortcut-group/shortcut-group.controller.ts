import {
  Controller, Get, Post, Patch, Put, Delete,
  Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../database/entities/tenant.entity';
import { ShortcutGroupService } from './shortcut-group.service';
import { CreateShortcutGroupDto, ShortcutGroupItemDto } from './dto/create-shortcut-group.dto';
import { UpdateShortcutGroupDto } from './dto/update-shortcut-group.dto';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ReplaceItemsDto {
  @ApiProperty({ type: [ShortcutGroupItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShortcutGroupItemDto)
  items: ShortcutGroupItemDto[];
}

@ApiTags('Shortcut Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shortcut-groups')
export class ShortcutGroupController {
  constructor(private readonly svc: ShortcutGroupService) {}

  @Get()
  list(@CurrentTenant() t: Tenant) {
    return this.svc.findAll(t.id);
  }

  @Get(':id')
  get(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(t.id, id);
  }

  @Post()
  create(@CurrentTenant() t: Tenant, @Body() dto: CreateShortcutGroupDto) {
    return this.svc.create(t.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentTenant() t: Tenant,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShortcutGroupDto,
  ) {
    return this.svc.update(t.id, id, dto);
  }

  @Put(':id/items')
  replaceItems(
    @CurrentTenant() t: Tenant,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceItemsDto,
  ) {
    return this.svc.replaceItems(t.id, id, dto.items);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentTenant() t: Tenant, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(t.id, id);
  }
}
