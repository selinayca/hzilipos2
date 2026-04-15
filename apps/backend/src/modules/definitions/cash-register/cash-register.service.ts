import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegister } from '../../../database/entities/cash-register.entity';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { UpdateCashRegisterDto } from './dto/update-cash-register.dto';

@Injectable()
export class CashRegisterService {
  constructor(@InjectRepository(CashRegister) private readonly repo: Repository<CashRegister>) {}
  findAll(tenantId: string) { return this.repo.find({ where: { tenantId }, order: { sortOrder: 'ASC', name: 'ASC' } }); }
  async findOne(tenantId: string, id: string) {
    const item = await this.repo.findOne({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Cash register not found');
    return item;
  }
  async create(tenantId: string, dto: CreateCashRegisterDto) {
    if (await this.repo.existsBy({ tenantId, code: dto.code })) throw new ConflictException(`Code "${dto.code}" already exists`);
    return this.repo.save(this.repo.create({ ...dto, tenantId }));
  }
  async update(tenantId: string, id: string, dto: UpdateCashRegisterDto) {
    const item = await this.findOne(tenantId, id);
    if (dto.code && dto.code !== item.code && await this.repo.existsBy({ tenantId, code: dto.code }))
      throw new ConflictException(`Code "${dto.code}" already exists`);
    return this.repo.save(Object.assign(item, dto));
  }
  async remove(tenantId: string, id: string) { await this.repo.remove(await this.findOne(tenantId, id)); }
}
