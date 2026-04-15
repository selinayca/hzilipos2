import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ShortcutGroup } from '../../database/entities/shortcut-group.entity';
import { ShortcutGroupItem } from '../../database/entities/shortcut-group-item.entity';
import { CreateShortcutGroupDto, ShortcutGroupItemDto } from './dto/create-shortcut-group.dto';
import { UpdateShortcutGroupDto } from './dto/update-shortcut-group.dto';

@Injectable()
export class ShortcutGroupService {
  constructor(
    @InjectRepository(ShortcutGroup) private readonly groupRepo: Repository<ShortcutGroup>,
    @InjectRepository(ShortcutGroupItem) private readonly itemRepo: Repository<ShortcutGroupItem>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(tenantId: string) {
    return this.groupRepo.find({
      where: { tenantId },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['items', 'items.product'],
    });
  }

  async findOne(tenantId: string, id: string) {
    const group = await this.groupRepo.findOne({
      where: { id, tenantId },
      relations: ['items', 'items.product'],
    });
    if (!group) throw new NotFoundException('Shortcut group not found');
    return group;
  }

  async create(tenantId: string, dto: CreateShortcutGroupDto) {
    return this.dataSource.transaction(async (em) => {
      const group = em.create(ShortcutGroup, {
        tenantId,
        name: dto.name,
        colorHex: dto.colorHex ?? null,
        sortOrder: dto.sortOrder ?? 0,
      });
      await em.save(group);

      if (dto.items?.length) {
        const items = dto.items.map((item, idx) =>
          em.create(ShortcutGroupItem, {
            tenantId,
            shortcutGroupId: group.id,
            productId: item.productId,
            sortOrder: item.sortOrder ?? idx,
          }),
        );
        await em.save(items);
      }

      return this.findOne(tenantId, group.id);
    });
  }

  async update(tenantId: string, id: string, dto: UpdateShortcutGroupDto) {
    const group = await this.groupRepo.findOneOrFail({ where: { id, tenantId } });
    Object.assign(group, {
      name: dto.name ?? group.name,
      colorHex: dto.colorHex !== undefined ? (dto.colorHex ?? null) : group.colorHex,
      sortOrder: dto.sortOrder ?? group.sortOrder,
    });
    await this.groupRepo.save(group);

    if (dto.items !== undefined) {
      await this.replaceItems(tenantId, id, dto.items ?? []);
    }

    return this.findOne(tenantId, id);
  }

  async replaceItems(tenantId: string, groupId: string, items: ShortcutGroupItemDto[]) {
    await this.itemRepo.delete({ tenantId, shortcutGroupId: groupId });

    if (items.length) {
      const newItems = items.map((item, idx) =>
        this.itemRepo.create({
          tenantId,
          shortcutGroupId: groupId,
          productId: item.productId,
          sortOrder: item.sortOrder ?? idx,
        }),
      );
      await this.itemRepo.save(newItems);
    }
  }

  async remove(tenantId: string, id: string) {
    const group = await this.groupRepo.findOneOrFail({ where: { id, tenantId } });
    await this.groupRepo.remove(group);
  }
}
