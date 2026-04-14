import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';

/**
 * Stock entity — one-to-one with Product.
 *
 * Kept separate from Product for two reasons:
 *   1. Stock is updated at high frequency (every sale); product metadata rarely changes.
 *      Separation reduces lock contention on the products table.
 *   2. Future: multi-location stock will need a (product_id, location_id) model.
 *      This separation makes that migration straightforward.
 */
@Entity('stocks')
@Index('idx_stock_tenant', ['tenantId'])
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid', unique: true })
  productId: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  /**
   * Low-stock threshold. When quantity drops to or below this value,
   * the system should trigger a low-stock alert (future: webhooks/push).
   */
  @Column({ type: 'int', default: 5 })
  lowStockThreshold: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // ── Relations ──────────────────────────────────────────────────────────
  @OneToOne(() => Product, (p) => p.stock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
