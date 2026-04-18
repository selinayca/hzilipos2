import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentType } from '../../../database/entities/payment-type.entity';
import { CreatePaymentTypeDto } from './dto/create-payment-type.dto';
import { UpdatePaymentTypeDto } from './dto/update-payment-type.dto';

@Injectable()
export class PaymentTypeService {
  constructor(@InjectRepository(PaymentType) private readonly repo: Repository<PaymentType>) {}
  findAll(tenantId: string) {
    return this.repo.find({ where: { tenantId }, relations: ['cashRegister'], order: { sortOrder: 'ASC', name: 'ASC' } });
  }
  async findOne(tenantId: string, id: string) {
    const item = await this.repo.findOne({ where: { id, tenantId }, relations: ['cashRegister'] });
    if (!item) throw new NotFoundException('Payment type not found');
    return item;
  }
  async create(tenantId: string, dto: CreatePaymentTypeDto) {
    if (await this.repo.existsBy({ tenantId, code: dto.code })) throw new ConflictException(`Code "${dto.code}" already exists`);
    return this.repo.save(this.repo.create({ ...dto, tenantId }));
  }
  async update(tenantId: string, id: string, dto: UpdatePaymentTypeDto) {
    const item = await this.findOne(tenantId, id);
    if (dto.code && dto.code !== item.code && await this.repo.existsBy({ tenantId, code: dto.code }))
      throw new ConflictException(`Code "${dto.code}" already exists`);
    return this.repo.save(Object.assign(item, dto));
  }
  async remove(tenantId: string, id: string) { await this.repo.remove(await this.findOne(tenantId, id)); }
}
