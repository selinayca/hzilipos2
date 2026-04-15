import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Color } from '../../../database/entities/color.entity';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@Injectable()
export class ColorService {
  constructor(@InjectRepository(Color) private readonly repo: Repository<Color>) {}
  findAll(tenantId: string) { return this.repo.find({ where: { tenantId }, order: { sortOrder: 'ASC', name: 'ASC' } }); }
  async findOne(tenantId: string, id: string) {
    const item = await this.repo.findOne({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Color not found');
    return item;
  }
  async create(tenantId: string, dto: CreateColorDto) { return this.repo.save(this.repo.create({ ...dto, tenantId })); }
  async update(tenantId: string, id: string, dto: UpdateColorDto) { return this.repo.save(Object.assign(await this.findOne(tenantId, id), dto)); }
  async remove(tenantId: string, id: string) { await this.repo.remove(await this.findOne(tenantId, id)); }
}
