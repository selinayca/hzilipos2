import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockGroup } from '../../../database/entities/stock-group.entity';
import { CreateStockGroupDto } from './dto/create-stock-group.dto';
import { UpdateStockGroupDto } from './dto/update-stock-group.dto';

@Injectable()
export class StockGroupService {
  constructor(@InjectRepository(StockGroup) private readonly repo: Repository<StockGroup>) {}
  findAll(tenantId: string) { return this.repo.find({ where: { tenantId }, order: { mainCode: 'ASC', subCode: 'ASC' } }); }
  async findOne(tenantId: string, id: string) {
    const item = await this.repo.findOne({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Stock group not found');
    return item;
  }
  async create(tenantId: string, dto: CreateStockGroupDto) { return this.repo.save(this.repo.create({ ...dto, tenantId })); }
  async update(tenantId: string, id: string, dto: UpdateStockGroupDto) { return this.repo.save(Object.assign(await this.findOne(tenantId, id), dto)); }
  async remove(tenantId: string, id: string) { await this.repo.remove(await this.findOne(tenantId, id)); }
}
