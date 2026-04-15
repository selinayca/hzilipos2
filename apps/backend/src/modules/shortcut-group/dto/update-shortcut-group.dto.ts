import { PartialType } from '@nestjs/swagger';
import { CreateShortcutGroupDto } from './create-shortcut-group.dto';

export class UpdateShortcutGroupDto extends PartialType(CreateShortcutGroupDto) {}
