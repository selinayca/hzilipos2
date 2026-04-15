import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../../../database/entities/warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(@InjectRepository(Warehouse) private readonly repo: Repository<Warehouse>) {}
  findAll(tenantId: string) { return this.repo.find({ where: { tenantId }, order: { sortOrder: 'ASC', name: 'ASC' } }); }
  async findOne(tenantId: string, id: string) {
    const item = await this.repo.findOne({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Warehouse not found');
    return item;
  }
  async create(tenantId: string, dto: CreateWarehouseDto) {
    if (await this.repo.existsBy({ tenantId, code: dto.code })) throw new ConflictException(`Code "${dto.code}" already exists`);
    return this.repo.save(this.repo.create({ ...dto, tenantId }));
  }
  async update(tenantId: string, id: string, dto: UpdateWarehouseDto) {
    const item = await this.findOne(tenantId, id);
    if (dto.code && dto.code !== item.code && await this.repo.existsBy({ tenantId, code: dto.code }))
      throw new ConflictException(`Code "${dto.code}" already exists`);
    return this.repo.save(Object.assign(item, dto));
  }
  async remove(tenantId: string, id: string) { await this.repo.remove(await this.findOne(tenantId, id)); }
}
