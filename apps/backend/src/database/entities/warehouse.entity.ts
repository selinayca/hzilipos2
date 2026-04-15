import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('warehouses')
@Index('idx_warehouse_tenant', ['tenantId'])
export class Warehouse {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) tenantId: string;
  @Column({ type: 'varchar', length: 50 }) code: string;
  @Column({ type: 'varchar', length: 100 }) name: string;
  @Column({ type: 'text', nullable: true }) address: string | null;

  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'int', default: 0 }) sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
