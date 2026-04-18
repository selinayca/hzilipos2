import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockMovement } from '../../database/entities/stock-movement.entity';
import { StockMovementLine } from '../../database/entities/stock-movement-line.entity';
import { Stock } from '../../database/entities/stock.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { QueryStockMovementDto } from './dto/query-stock-movement.dto';

@Injectable()
export class StockMovementService {
  constructor(
    @InjectRepository(StockMovement) private readonly repo: Repository<StockMovement>,
    private readonly dataSource: DataSource,
  ) {}

  private nextDocNumber(tenantId: string) {
    return this.repo
      .createQueryBuilder('sm')
      .where('sm.tenantId = :tenantId', { tenantId })
      .getCount()
      .then((n) => `SF-${String(n + 1).padStart(6, '0')}`);
  }

  async findAll(tenantId: string, query: QueryStockMovementDto) {
    const qb = this.repo
      .createQueryBuilder('sm')
      .leftJoinAndSelect('sm.inWarehouse', 'iw')
      .leftJoinAndSelect('sm.outWarehouse', 'ow')
      .where('sm.tenantId = :tenantId', { tenantId });

    if (query.movementType) qb.andWhere('sm.movementType = :t', { t: query.movementType });

    qb.orderBy('sm.occurredAt', 'DESC');
    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) };
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['lines', 'lines.product', 'inWarehouse', 'outWarehouse'],
    });
    if (!item) throw new NotFoundException('Stock movement not found');
    return item;
  }

  async create(tenantId: string, dto: CreateStockMovementDto) {
    return this.dataSource.transaction(async (em) => {
      const docNumber = await this.nextDocNumber(tenantId);

      const movement = em.create(StockMovement, {
        tenantId,
        documentNumber: docNumber,
        movementType: dto.movementType,
        description: dto.description ?? null,
        inWarehouseId: dto.inWarehouseId ?? null,
        outWarehouseId: dto.outWarehouseId ?? null,
        personnelName: dto.personnelName ?? null,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      });
      await em.save(movement);

      const lines = dto.lines.map((l, i) =>
        em.create(StockMovementLine, {
          movementId: movement.id,
          tenantId,
          productId: l.productId ?? null,
          productName: l.productName,
          productBarcode: l.productBarcode ?? null,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents ?? 0,
          taxRateBps: l.taxRateBps ?? 0,
          lineTotalCents: (l.unitPriceCents ?? 0) * l.quantity,
          sortOrder: l.sortOrder ?? i,
        }),
      );
      await em.save(lines);

      // Update stock quantities
      for (const line of dto.lines) {
        if (!line.productId) continue;
        const stock = await em.findOne(Stock, { where: { tenantId, productId: line.productId } });
        if (!stock) continue;
        const delta = ['entry', 'opening'].includes(dto.movementType) ? line.quantity : -line.quantity;
        stock.quantity = Math.max(0, stock.quantity + delta);
        await em.save(stock);
      }

      return this.findOne(tenantId, movement.id);
    });
  }

  async remove(tenantId: string, id: string) {
    const item = await this.findOne(tenantId, id);
    await this.repo.remove(item);
  }
}
