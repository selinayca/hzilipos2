import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * InitialSchema — creates the full database schema from scratch.
 *
 * Run:   pnpm db:migrate
 * Revert: pnpm db:migrate:revert
 *
 * Design notes:
 *  - All PKs are UUID (gen_random_uuid() default)
 *  - All timestamps are TIMESTAMPTZ (UTC-aware)
 *  - Money is stored as INTEGER (cents)
 *  - Soft deletes via deleted_at column
 *  - Composite indexes on (tenant_id, ...) for all tenant-scoped queries
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Extensions ──────────────────────────────────────────────────────
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ── ENUM types ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'pro', 'enterprise')
    `);
    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'cashier')
    `);
    await queryRunner.query(`
      CREATE TYPE order_status AS ENUM ('pending', 'paid', 'refunded', 'partial_refund', 'void')
    `);
    await queryRunner.query(`
      CREATE TYPE payment_method AS ENUM ('cash', 'card', 'mixed')
    `);

    // ── tenants ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE tenants (
        id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        slug        VARCHAR(63) NOT NULL,
        name        VARCHAR(255) NOT NULL,
        logo_url    VARCHAR(500),
        plan_tier   plan_tier   NOT NULL DEFAULT 'free',
        is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
        settings    JSONB       NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at  TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_tenant_slug" ON tenants (slug) WHERE deleted_at IS NULL`);

    // ── users ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE users (
        id                  UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id           UUID         REFERENCES tenants(id) ON DELETE CASCADE,
        email               VARCHAR(255) NOT NULL,
        name                VARCHAR(255) NOT NULL,
        password_hash       VARCHAR(72)  NOT NULL,
        role                user_role    NOT NULL DEFAULT 'cashier',
        is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
        refresh_token_hash  VARCHAR(72),
        last_login_at       TIMESTAMPTZ,
        created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        deleted_at          TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_user_tenant_email"
        ON users (tenant_id, email)
        WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`CREATE INDEX "idx_user_tenant_id" ON users (tenant_id)`);

    // ── categories ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE categories (
        id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name        VARCHAR(100) NOT NULL,
        color_hex   VARCHAR(10),
        sort_order  INT          NOT NULL DEFAULT 0,
        is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_category_tenant" ON categories (tenant_id)`);

    // ── products ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE products (
        id           UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        category_id  UUID         REFERENCES categories(id) ON DELETE SET NULL,
        name         VARCHAR(255) NOT NULL,
        description  TEXT,
        barcode      VARCHAR(100),
        sku          VARCHAR(50),
        price_cents  INT          NOT NULL CHECK (price_cents >= 0),
        tax_rate_bps INT          NOT NULL DEFAULT 0 CHECK (tax_rate_bps >= 0),
        image_url    VARCHAR(500),
        is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
        track_stock  BOOLEAN      NOT NULL DEFAULT FALSE,
        sort_order   INT          NOT NULL DEFAULT 0,
        version      INT          NOT NULL DEFAULT 1,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        deleted_at   TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_product_tenant" ON products (tenant_id)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_product_tenant_barcode"
        ON products (tenant_id, barcode)
        WHERE barcode IS NOT NULL AND deleted_at IS NULL
    `);
    await queryRunner.query(`CREATE INDEX "idx_product_tenant_category" ON products (tenant_id, category_id)`);
    await queryRunner.query(`CREATE INDEX "idx_product_tenant_active"   ON products (tenant_id, is_active)`);
    await queryRunner.query(`CREATE INDEX "idx_product_tenant_version"  ON products (tenant_id, version)`);

    // ── stocks ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE stocks (
        id                   UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id            UUID NOT NULL,
        product_id           UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
        quantity             INT  NOT NULL DEFAULT 0,
        low_stock_threshold  INT  NOT NULL DEFAULT 5,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_stock_tenant" ON stocks (tenant_id)`);

    // ── orders ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE orders (
        id                   UUID           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id            UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        cashier_id           UUID           REFERENCES users(id) ON DELETE SET NULL,
        order_number         VARCHAR(30)    NOT NULL,
        status               order_status   NOT NULL DEFAULT 'pending',
        payment_method       payment_method,
        subtotal_cents       INT            NOT NULL,
        discount_cents       INT            NOT NULL DEFAULT 0,
        tax_cents            INT            NOT NULL DEFAULT 0,
        total_cents          INT            NOT NULL,
        cash_tendered_cents  INT            NOT NULL DEFAULT 0,
        change_cents         INT            NOT NULL DEFAULT 0,
        offline_sync_id      UUID,
        offline_created_at   TIMESTAMPTZ,
        notes                TEXT,
        created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
        updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_order_tenant"         ON orders (tenant_id)`);
    await queryRunner.query(`CREATE INDEX "idx_order_tenant_status"  ON orders (tenant_id, status)`);
    await queryRunner.query(`CREATE INDEX "idx_order_tenant_created" ON orders (tenant_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX "idx_order_tenant_cashier" ON orders (tenant_id, cashier_id)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_order_offline_sync"
        ON orders (tenant_id, offline_sync_id)
        WHERE offline_sync_id IS NOT NULL
    `);

    // ── order_items ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE order_items (
        id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id         UUID         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        tenant_id        UUID         NOT NULL,
        product_id       UUID         REFERENCES products(id) ON DELETE SET NULL,
        product_name     VARCHAR(255) NOT NULL,
        product_barcode  VARCHAR(100),
        unit_price_cents INT          NOT NULL,
        tax_rate_bps     INT          NOT NULL DEFAULT 0,
        quantity         INT          NOT NULL CHECK (quantity > 0),
        discount_cents   INT          NOT NULL DEFAULT 0,
        line_total_cents INT          NOT NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_order_item_order"   ON order_items (order_id)`);
    await queryRunner.query(`CREATE INDEX "idx_order_item_product" ON order_items (product_id)`);

    // ── updated_at triggers (auto-update on row change) ──────────────────
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    for (const table of ['tenants', 'users', 'categories', 'products', 'stocks', 'orders']) {
      await queryRunner.query(`
        CREATE TRIGGER trg_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse dependency order
    for (const table of ['order_items', 'orders', 'stocks', 'products', 'categories', 'users', 'tenants']) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at() CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_method`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
    await queryRunner.query(`DROP TYPE IF EXISTS plan_tier`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "pgcrypto"`);
  }
}
