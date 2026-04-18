import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, Index,
} from 'typeorm';
import { ShortcutGroup } from './shortcut-group.entity';
import { Product } from './product.entity';

@Entity('shortcut_group_items')
@Index('idx_shortcut_item_group', ['shortcutGroupId'])
@Index('idx_shortcut_item_tenant', ['tenantId'])
export class ShortcutGroupItem {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) tenantId: string;
  @Column({ type: 'uuid' }) shortcutGroupId: string;
  @Column({ type: 'uuid' }) productId: string;
  @Column({ type: 'int', default: 0 }) sortOrder: number;

  @ManyToOne(() => ShortcutGroup, (g) => g.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shortcut_group_id' })
  group: ShortcutGroup;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
