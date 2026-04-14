import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';
import { Order } from './order.entity';

export enum PlanTier {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

/**
 * Tenant is the top-level isolation boundary.
 * Every other entity in the system carries a tenantId FK.
 *
 * Design notes:
 * - slug is the subdomain identifier (unique, immutable after creation)
 * - planTier gates feature access — evaluated in guards/services
 * - settings is a JSONB bag for per-tenant config (currency, tax rates, etc.)
 */
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 63 })
  slug: string; // subdomain — e.g. "acme" for acme.example.com

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'enum', enum: PlanTier, default: PlanTier.FREE })
  planTier: PlanTier;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Per-tenant configuration stored as JSONB.
   * Keys (examples):
   *   currency: 'TRY'
   *   taxRate: 0.18
   *   locale: 'tr-TR'
   *   receiptFooter: 'Teşekkürler!'
   */
  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  // ── Relations ──────────────────────────────────────────────────────────
  @OneToMany(() => User, (u) => u.tenant)
  users: User[];

  @OneToMany(() => Product, (p) => p.tenant)
  products: Product[];

  @OneToMany(() => Order, (o) => o.tenant)
  orders: Order[];
}
