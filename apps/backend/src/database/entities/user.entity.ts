import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Tenant } from './tenant.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',   // SaaS operator — cross-tenant access
  TENANT_ADMIN = 'tenant_admin', // Business owner / manager
  CASHIER = 'cashier',           // POS operator
}

/**
 * User entity.
 *
 * Multi-tenancy note:
 *   - SUPER_ADMIN rows have tenantId = NULL (they span tenants)
 *   - All other roles must have a tenantId
 *
 * Index strategy:
 *   - (tenantId, email) unique index — emails are unique per tenant, not globally.
 *     A user can have accounts in multiple tenants with the same email.
 */
@Entity('users')
@Index('idx_user_tenant_email', ['tenantId', 'email'], { unique: true })
@Index('idx_user_tenant_id', ['tenantId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Exclude() // Never serialised into API responses
  @Column({ type: 'varchar', length: 72 }) // bcrypt output is always 60 chars; 72 is safe upper bound
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CASHIER })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Refresh token hash — stored to allow single-device invalidation.
   * Null when user is logged out.
   */
  @Exclude()
  @Column({ type: 'varchar', length: 72, nullable: true })
  refreshTokenHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  // ── Relations ──────────────────────────────────────────────────────────
  @ManyToOne(() => Tenant, (t) => t.users, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;
}
