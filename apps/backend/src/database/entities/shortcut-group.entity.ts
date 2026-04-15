import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { ShortcutGroupItem } from './shortcut-group-item.entity';

@Entity('shortcut_groups')
@Index('idx_shortcut_group_tenant', ['tenantId'])
export class ShortcutGroup {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) tenantId: string;
  @Column({ type: 'varchar', length: 100 }) name: string;

  /** Optional display color hex — e.g. "#FF5733" */
  @Column({ type: 'varchar', length: 7, nullable: true }) colorHex: string | null;

  @Column({ type: 'int', default: 0 }) sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => ShortcutGroupItem, (item) => item.group, { cascade: true })
  items: ShortcutGroupItem[];
}
