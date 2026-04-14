import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

/**
 * OrderItem — line item within an Order.
 *
 * Product fields (name, price) are snapshotted at sale time.
 * This is intentional: if a product's price changes later, historical
 * orders must still reflect what was actually charged.
 */
@Entity('order_items')
@Index('idx_order_item_order', ['orderId'])
@Index('idx_order_item_product', ['productId'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  productId: string | null; // nullable: product may be deleted after sale

  // ── Snapshot of product at time of sale ─────────────────────────────
  @Column({ type: 'varchar', length: 255 })
  productName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  productBarcode: string | null;

  @Column({ type: 'int' })
  unitPriceCents: number;

  @Column({ type: 'int', default: 0 })
  taxRateBps: number;
  // ────────────────────────────────────────────────────────────────────

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  discountCents: number;

  @Column({ type: 'int' })
  lineTotalCents: number; // (unitPrice * qty) - discount

  // ── Relations ──────────────────────────────────────────────────────────
  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;
}
