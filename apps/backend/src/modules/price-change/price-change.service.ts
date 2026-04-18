import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PriceChange } from '../../database/entities/price-change.entity';
import { PriceChangeLine } from '../../database/entities/price-change-line.entity';
import { Product } from '../../database/entities/product.entity';
import { CreatePriceChangeDto } from './dto/create-price-change.dto';
import { QueryPriceChangeDto } from './dto/query-price-change.dto';

@Injectable()
export class PriceChangeService {
  constructor(
    @InjectRepository(PriceChange) private readonly repo: Repository<PriceChange>,
    private readonly dataSource: DataSource,
  ) {}

  private async nextDocNumber(tenantId: string) {
    const n = await this.repo.countBy({ tenantId });
    return `FD-${String(n + 1).padStart(6, '0')}`;
  }

  async findAll(tenantId: string, query: QueryPriceChangeDto) {
    const [items, total] = await this.repo.findAndCount({
      where: { tenantId },
      order: { occurredAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { items, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) };
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.repo.findOne({ where: { id, tenantId }, relations: ['lines', 'lines.product'] });
    if (!item) throw new NotFoundException('Price change not found');
    return item;
  }

  async create(tenantId: string, dto: CreatePriceChangeDto) {
    return this.dataSource.transaction(async (em) => {
      const docNumber = await this.nextDocNumber(tenantId);

      const pc = em.create(PriceChange, {
        tenantId,
        documentNumber: docNumber,
        description: dto.description ?? null,
        personnelName: dto.personnelName ?? null,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      });
      await em.save(pc);

      const lines = dto.lines.map((l) =>
        em.create(PriceChangeLine, {
          priceChangeId: pc.id,
          tenantId,
          productId: l.productId ?? null,
          productName: l.productName,
          productBarcode: l.productBarcode ?? null,
          oldPriceCents: l.oldPriceCents,
          newPriceCents: l.newPriceCents,
          purchasePriceCents: l.purchasePriceCents ?? 0,
          taxRateBps: l.taxRateBps ?? 0,
        }),
      );
      await em.save(lines);

      // Apply new prices to products
      for (const line of dto.lines) {
        if (!line.productId) continue;
        await em.update(Product, { id: line.productId, tenantId }, {
          priceCents: line.newPriceCents,
          version: () => 'version + 1',
        });
      }

      return this.findOne(tenantId, pc.id);
    });
  }

  async remove(tenantId: string, id: string) {
    const item = await this.findOne(tenantId, id);
    await this.repo.remove(item);
  }
}
