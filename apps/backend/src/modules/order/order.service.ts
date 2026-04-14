import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Order, OrderStatus } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Product } from '../../database/entities/product.entity';
import { Stock } from '../../database/entities/stock.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async create(tenantId: string, cashierId: string, dto: CreateOrderDto): Promise<Order> {
    // Idempotency: reject duplicate offline sync IDs
    if (dto.offlineSyncId) {
      const duplicate = await this.orderRepo.existsBy({
        tenantId,
        offlineSyncId: dto.offlineSyncId,
      });
      if (duplicate) {
        // Return the existing order instead of throwing — allows safe client retry
        const existing = await this.orderRepo.findOne({
          where: { tenantId, offlineSyncId: dto.offlineSyncId },
          relations: ['items'],
        });
        return existing!;
      }
    }

    // Load all referenced products in one query
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.stock', 'stock')
      .where('p.id IN (:...ids)', { ids: productIds })
      .andWhere('p.tenantId = :tenantId', { tenantId })
      .getMany();

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate items and compute totals
    let subtotalCents = 0;
    let taxCents = 0;

    const itemEntities: Partial<OrderItem>[] = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      if (!product.isActive) {
        throw new BadRequestException(`Product "${product.name}" is not available`);
      }
      if (product.trackStock && product.stock.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}" (available: ${product.stock.quantity})`,
        );
      }

      const lineTotalCents =
        item.unitPriceCents * item.quantity - (item.discountCents ?? 0);
      const lineTax = Math.round(
        lineTotalCents * (product.taxRateBps / 10000),
      );

      subtotalCents += lineTotalCents;
      taxCents += lineTax;

      return {
        tenantId,
        productId: product.id,
        productName: product.name,
        productBarcode: product.barcode,
        unitPriceCents: item.unitPriceCents,
        taxRateBps: product.taxRateBps,
        quantity: item.quantity,
        discountCents: item.discountCents ?? 0,
        lineTotalCents,
      };
    });

    const orderDiscountCents = dto.discountCents ?? 0;
    const totalCents = subtotalCents - orderDiscountCents + taxCents;
    const changeCents = dto.cashTenderedCents
      ? Math.max(0, dto.cashTenderedCents - totalCents)
      : 0;

    const orderNumber = await this.generateOrderNumber(tenantId);

    return this.dataSource.transaction(async (em) => {
      const order = em.create(Order, {
        tenantId,
        cashierId,
        orderNumber,
        status: OrderStatus.PAID,
        paymentMethod: dto.paymentMethod,
        subtotalCents,
        discountCents: orderDiscountCents,
        taxCents,
        totalCents,
        cashTenderedCents: dto.cashTenderedCents ?? 0,
        changeCents,
        offlineSyncId: dto.offlineSyncId ?? null,
        offlineCreatedAt: dto.offlineCreatedAt ? new Date(dto.offlineCreatedAt) : null,
        notes: dto.notes ?? null,
      });
      await em.save(order);

      const items = itemEntities.map((i) =>
        em.create(OrderItem, { ...i, orderId: order.id }),
      );
      await em.save(items);

      // Decrement stock for tracked products
      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        if (product.trackStock) {
          await em
            .createQueryBuilder()
            .update(Stock)
            .set({ quantity: () => `quantity - ${item.quantity}` })
            .where('productId = :pid AND tenantId = :tid', {
              pid: item.productId,
              tid: tenantId,
            })
            .execute();
        }
      }

      return em.findOne(Order, {
        where: { id: order.id },
        relations: ['items'],
      }) as Promise<Order>;
    });
  }

  async findAll(
    tenantId: string,
    query: { page: number; limit: number; from?: Date; to?: Date },
  ) {
    const where: any = { tenantId };
    if (query.from && query.to) {
      where.createdAt = Between(query.from, query.to);
    }

    const [items, total] = await this.orderRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      relations: ['cashier'],
    });

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id, tenantId },
      relations: ['items', 'cashier'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const count = await this.orderRepo.countBy({ tenantId });
    return `ORD-${String(count + 1).padStart(5, '0')}`;
  }
}
