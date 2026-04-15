import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, Index,
} from 'typeorm';
import { PriceChange } from './price-change.entity';
import { Product } from './product.entity';

@Entity('price_change_lines')
@Index('idx_pcl_price_change', ['priceChangeId'])
@Index('idx_pcl_product', ['productId'])
export class PriceChangeLine {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) priceChangeId: string;
  @Column({ type: 'uuid' }) tenantId: string;

  @Column({ type: 'uuid', nullable: true }) productId: string | null;
  @Column({ type: 'varchar', length: 255 }) productName: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) productBarcode: string | null;

  @Column({ type: 'int' }) oldPriceCents: number;
  @Column({ type: 'int' }) newPriceCents: number;
  @Column({ type: 'int', default: 0 }) purchasePriceCents: number;
  @Column({ type: 'int', default: 0 }) taxRateBps: number;

  @ManyToOne(() => PriceChange, (pc) => pc.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'price_change_id' })
  priceChange: PriceChange;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;
}
