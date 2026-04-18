import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Size } from '../../../database/entities/size.entity';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';

@Injectable()
export class SizeService {
  constructor(@InjectRepository(Size) private readonly repo: Repository<Size>) {}
  findAll(tenantId: string) { return this.repo.find({ where: { tenantId }, order: { sortOrder: 'ASC', name: 'ASC' } }); }
  async findOne(tenantId: string, id: string) {
    const item = await this.repo.findOne({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Size not found');
    return item;
  }
  async create(tenantId: string, dto: CreateSizeDto) { return this.repo.save(this.repo.create({ ...dto, tenantId })); }
  async update(tenantId: string, id: string, dto: UpdateSizeDto) { return this.repo.save(Object.assign(await this.findOne(tenantId, id), dto)); }
  async remove(tenantId: string, id: string) { await this.repo.remove(await this.findOne(tenantId, id)); }
}
