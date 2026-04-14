import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../../database/entities/stock.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly repo: Repository<Stock>,
  ) {}

  async getLowStock(tenantId: string) {
    return this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.product', 'product')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.quantity <= s.lowStockThreshold')
      .andWhere('product.trackStock = true')
      .andWhere('product.isActive = true')
      .orderBy('s.quantity', 'ASC')
      .getMany();
  }

  async adjust(
    tenantId: string,
    productId: string,
    delta: number,
  ): Promise<Stock> {
    const stock = await this.repo.findOne({ where: { tenantId, productId } });
    if (!stock) throw new NotFoundException('Stock record not found');
    stock.quantity = Math.max(0, stock.quantity + delta);
    return this.repo.save(stock);
  }

  async setThreshold(
    tenantId: string,
    productId: string,
    threshold: number,
  ): Promise<Stock> {
    const stock = await this.repo.findOne({ where: { tenantId, productId } });
    if (!stock) throw new NotFoundException('Stock record not found');
    stock.lowStockThreshold = threshold;
    return this.repo.save(stock);
  }
}
