import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('stock_groups')
@Index('idx_stock_group_tenant', ['tenantId'])
export class StockGroup {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) tenantId: string;
  @Column({ type: 'varchar', length: 50 }) mainCode: string;
  @Column({ type: 'varchar', length: 100 }) mainName: string;
  @Column({ type: 'varchar', length: 50, nullable: true }) subCode: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) subName: string | null;

  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'int', default: 0 }) sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
