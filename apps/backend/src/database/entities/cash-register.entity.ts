import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export enum CashRegisterType {
  CASH = 'cash',
  BANK_POS = 'bank_pos',
  OTHER = 'other',
}

@Entity('cash_registers')
@Index('idx_cash_register_tenant', ['tenantId'])
export class CashRegister {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) tenantId: string;
  @Column({ type: 'varchar', length: 50 }) code: string;
  @Column({ type: 'varchar', length: 100 }) name: string;
  @Column({ type: 'enum', enum: CashRegisterType, default: CashRegisterType.CASH })
  type: CashRegisterType;

  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'int', default: 0 }) sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
