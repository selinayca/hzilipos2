import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Warehouse } from './warehouse.entity';
import { StockMovementLine } from './stock-movement-line.entity';

export enum MovementType {
  ENTRY = 'entry',         // Giriş Fişi
  EXIT = 'exit',           // Çıkış Fişi
  TRANSFER = 'transfer',   // Transfer Fişi
  WASTE = 'waste',         // Fire Fişi
  OPENING = 'opening',     // Devir Fişi
}

@Entity('stock_movements')
@Index('idx_stock_movement_tenant', ['tenantId'])
@Index('idx_stock_movement_tenant_type', ['tenantId', 'movementType'])
@Index('idx_stock_movement_tenant_date', ['tenantId', 'occurredAt'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) tenantId: string;
  @Column({ type: 'varchar', length: 30 }) documentNumber: string;
  @Column({ type: 'enum', enum: MovementType }) movementType: MovementType;
  @Column({ type: 'text', nullable: true }) description: string | null;

  @Column({ type: 'uuid', nullable: true }) inWarehouseId: string | null;
  @Column({ type: 'uuid', nullable: true }) outWarehouseId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true }) personnelName: string | null;
  @Column({ type: 'timestamptz' }) occurredAt: Date;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Warehouse, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'in_warehouse_id' })
  inWarehouse: Warehouse | null;

  @ManyToOne(() => Warehouse, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'out_warehouse_id' })
  outWarehouse: Warehouse | null;

  @OneToMany(() => StockMovementLine, (l) => l.movement, { cascade: ['insert'] })
  lines: StockMovementLine[];
}
