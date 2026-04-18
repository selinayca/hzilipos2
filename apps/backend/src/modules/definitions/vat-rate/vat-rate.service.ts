import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VatRate } from '../../../database/entities/vat-rate.entity';
import { CreateVatRateDto } from './dto/create-vat-rate.dto';
import { UpdateVatRateDto } from './dto/update-vat-rate.dto';

@Injectable()
export class VatRateService {
  constructor(@InjectRepository(VatRate) private readonly repo: Repository<VatRate>) {}

  findAll(tenantId: string) {
    return this.repo.find({ where: { tenantId }, order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.repo.findOne({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('VAT rate not found');
    return item;
  }

  async create(tenantId: string, dto: CreateVatRateDto) {
    const exists = await this.repo.existsBy({ tenantId, code: dto.code });
    if (exists) throw new ConflictException(`Code "${dto.code}" already exists`);
    return this.repo.save(this.repo.create({ ...dto, tenantId }));
  }

  async update(tenantId: string, id: string, dto: UpdateVatRateDto) {
    const item = await this.findOne(tenantId, id);
    if (dto.code && dto.code !== item.code) {
      const exists = await this.repo.existsBy({ tenantId, code: dto.code });
      if (exists) throw new ConflictException(`Code "${dto.code}" already exists`);
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(tenantId: string, id: string) {
    const item = await this.findOne(tenantId, id);
    await this.repo.remove(item);
  }
}
