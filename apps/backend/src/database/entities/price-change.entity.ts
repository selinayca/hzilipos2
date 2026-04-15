import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { PriceChangeLine } from './price-change-line.entity';

@Entity('price_changes')
@Index('idx_price_change_tenant', ['tenantId'])
@Index('idx_price_change_tenant_date', ['tenantId', 'occurredAt'])
export class PriceChange {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) tenantId: string;
  @Column({ type: 'varchar', length: 30 }) documentNumber: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) personnelName: string | null;
  @Column({ type: 'timestamptz' }) occurredAt: Date;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => PriceChangeLine, (l) => l.priceChange, { cascade: ['insert'] })
  lines: PriceChangeLine[];
}
