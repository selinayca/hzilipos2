import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Category } from './category.entity';
import { Stock } from './stock.entity';
import { Unit } from './unit.entity';
import { StockGroup } from './stock-group.entity';
import { Shelf } from './shelf.entity';

/**
 * Product entity.
 *
 * Index strategy:
 *   - (tenantId) — all product queries are tenant-scoped
 *   - (tenantId, barcode) unique — barcode scanning at POS
 *   - (tenantId, categoryId) — category filter in POS product grid
 *   - (tenantId, isActive) — hide archived products from POS
 *
 * Price is stored as integer cents to avoid floating point issues.
 * Frontend divides by 100 for display; backend receives/sends cents.
 */
@Entity('products')
@Index('idx_product_tenant', ['tenantId'])
@Index('idx_product_tenant_barcode', ['tenantId', 'barcode'], { unique: true, where: '"barcode" IS NOT NULL' })
@Index('idx_product_tenant_category', ['tenantId', 'categoryId'])
@Index('idx_product_tenant_active', ['tenantId', 'isActive'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sku: string | null;

  /**
   * Price in smallest currency unit (e.g., kuruş for TRY, cents for USD).
   * NEVER store as float. Avoids rounding errors in totals.
   */
  @Column({ type: 'int' })
  priceCents: number;

  @Column({ type: 'int', nullable: true }) priceCents2: number | null;
  @Column({ type: 'int', nullable: true }) priceCents3: number | null;
  @Column({ type: 'int', nullable: true }) priceCents4: number | null;

  /** Purchase/cost price in cents */
  @Column({ type: 'int', nullable: true }) purchasePriceCents: number | null;

  @Column({ type: 'int', default: 0 })
  taxRateBps: number; // tax rate in basis points, e.g. 1800 = 18%

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  trackStock: boolean; // if false, stock checks are skipped

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  // ── Extended attributes ────────────────────────────────────────────────
  @Column({ type: 'uuid', nullable: true }) unitId: string | null;
  @Column({ type: 'uuid', nullable: true }) stockGroupId: string | null;
  @Column({ type: 'uuid', nullable: true }) shelfId: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) manufacturerName: string | null;

  /** Additional/alias barcodes for the same product */
  @Column({ type: 'jsonb', default: [] }) extraBarcodes: string[];

  @Column({ type: 'varchar', length: 255, nullable: true }) customField1: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) customField2: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) customField3: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) customField4: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) customField5: string | null;

  /**
   * Incremented on every update — POS clients use this as a
   * cheap sync cursor ("give me products with version > N").
   */
  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  // ── Relations ──────────────────────────────────────────────────────────
  @ManyToOne(() => Tenant, (t) => t.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Category, (c) => c.products, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @OneToOne(() => Stock, (s) => s.product, { cascade: ['insert'] })
  stock: Stock;

  @ManyToOne(() => Unit, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit | null;

  @ManyToOne(() => StockGroup, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'stock_group_id' })
  stockGroup: StockGroup | null;

  @ManyToOne(() => Shelf, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'shelf_id' })
  shelf: Shelf | null;
}
