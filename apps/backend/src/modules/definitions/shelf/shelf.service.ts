import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shelf } from '../../../database/entities/shelf.entity';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { UpdateShelfDto } from './dto/update-shelf.dto';

@Injectable()
export class ShelfService {
  constructor(@InjectRepository(Shelf) private readonly repo: Repository<Shelf>) {}
  findAll(tenantId: string) { return this.repo.find({ where: { tenantId }, order: { sortOrder: 'ASC', name: 'ASC' } }); }
  async findOne(tenantId: string, id: string) {
    const item = await this.repo.findOne({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Shelf not found');
    return item;
  }
  async create(tenantId: string, dto: CreateShelfDto) {
    if (await this.repo.existsBy({ tenantId, code: dto.code })) throw new ConflictException(`Code "${dto.code}" already exists`);
    return this.repo.save(this.repo.create({ ...dto, tenantId }));
  }
  async update(tenantId: string, id: string, dto: UpdateShelfDto) {
    const item = await this.findOne(tenantId, id);
    if (dto.code && dto.code !== item.code && await this.repo.existsBy({ tenantId, code: dto.code }))
      throw new ConflictException(`Code "${dto.code}" already exists`);
    return this.repo.save(Object.assign(item, dto));
  }
  async remove(tenantId: string, id: string) { await this.repo.remove(await this.findOne(tenantId, id)); }
}
