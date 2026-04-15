import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShortcutGroup } from '../../database/entities/shortcut-group.entity';
import { ShortcutGroupItem } from '../../database/entities/shortcut-group-item.entity';
import { ShortcutGroupController } from './shortcut-group.controller';
import { ShortcutGroupService } from './shortcut-group.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShortcutGroup, ShortcutGroupItem])],
  controllers: [ShortcutGroupController],
  providers: [ShortcutGroupService],
  exports: [ShortcutGroupService],
})
export class ShortcutGroupModule {}
