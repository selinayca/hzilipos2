import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('vat_rates')
@Index('idx_vat_rate_tenant', ['tenantId'])
export class VatRate {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) tenantId: string;
  @Column({ type: 'varchar', length: 20 }) code: string;
  @Column({ type: 'varchar', length: 100 }) name: string;

  /** Rate in basis points — e.g. 1800 = 18% */
  @Column({ type: 'int', default: 0 }) rateBps: number;

  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'int', default: 0 }) sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
