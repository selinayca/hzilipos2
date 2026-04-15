import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { CashRegister } from './cash-register.entity';

@Entity('payment_types')
@Index('idx_payment_type_tenant', ['tenantId'])
export class PaymentType {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) tenantId: string;
  @Column({ type: 'varchar', length: 50 }) code: string;        // e.g. NAKIT, KART
  @Column({ type: 'varchar', length: 100 }) name: string;       // e.g. Nakit, Kredi Kartı

  /** Commission in basis points — e.g. 179 = 1.79% */
  @Column({ type: 'int', default: 0 }) commissionBps: number;

  @Column({ type: 'uuid', nullable: true }) cashRegisterId: string | null;

  @Column({ type: 'boolean', default: true }) isActive: boolean;
  @Column({ type: 'int', default: 0 }) sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => CashRegister, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cash_register_id' })
  cashRegister: CashRegister | null;
}
