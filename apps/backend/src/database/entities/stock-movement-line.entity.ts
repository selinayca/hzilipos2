import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, Index,
} from 'typeorm';
import { StockMovement } from './stock-movement.entity';
import { Product } from './product.entity';

@Entity('stock_movement_lines')
@Index('idx_sml_movement', ['movementId'])
@Index('idx_sml_product', ['productId'])
export class StockMovementLine {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) movementId: string;
  @Column({ type: 'uuid' }) tenantId: string;

  @Column({ type: 'uuid', nullable: true }) productId: string | null;
  @Column({ type: 'varchar', length: 255 }) productName: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) productBarcode: string | null;

  /** Quantity in smallest unit (e.g. units, grams) */
  @Column({ type: 'int' }) quantity: number;

  /** Unit price in cents */
  @Column({ type: 'int', default: 0 }) unitPriceCents: number;

  /** Tax rate in basis points */
  @Column({ type: 'int', default: 0 }) taxRateBps: number;

  /** Line total in cents */
  @Column({ type: 'int', default: 0 }) lineTotalCents: number;

  @Column({ type: 'int', default: 0 }) sortOrder: number;

  @ManyToOne(() => StockMovement, (m) => m.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movement_id' })
  movement: StockMovement;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;
}
