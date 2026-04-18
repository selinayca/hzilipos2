import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds definition/lookup tables and enhances the products table.
 *
 * New tables: vat_rates, units, stock_groups, shelves, warehouses,
 *             colors, sizes, cash_registers, payment_types,
 *             stock_movements, stock_movement_lines,
 *             price_changes, price_change_lines
 *
 * Product enhancements: purchase_price_cents, price_cents_2/3/4,
 *   unit_id, stock_group_id, shelf_id, manufacturer_name, extra_barcodes,
 *   custom_field_1..5
 */
export class AddDefinitionTables1700000000002 implements MigrationInterface {
  name = 'AddDefinitionTables1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── ENUMs ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE cash_register_type AS ENUM ('cash', 'bank_pos', 'other')
    `);
    await queryRunner.query(`
      CREATE TYPE movement_type AS ENUM ('entry', 'exit', 'transfer', 'waste', 'opening')
    `);

    // ── vat_rates ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE vat_rates (
        id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        code        VARCHAR(20) NOT NULL,
        name        VARCHAR(100) NOT NULL,
        rate_bps    INT         NOT NULL DEFAULT 0,
        is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
        sort_order  INT         NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_vat_rate_tenant" ON vat_rates (tenant_id)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_vat_rate_tenant_code" ON vat_rates (tenant_id, code)
    `);

    // ── units ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE units (
        id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        code        VARCHAR(20) NOT NULL,
        name        VARCHAR(100) NOT NULL,
        is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
        sort_order  INT         NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_unit_tenant" ON units (tenant_id)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_unit_tenant_code" ON units (tenant_id, code)
    `);

    // ── stock_groups ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE stock_groups (
        id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        main_code   VARCHAR(50)  NOT NULL,
        main_name   VARCHAR(100) NOT NULL,
        sub_code    VARCHAR(50),
        sub_name    VARCHAR(100),
        is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
        sort_order  INT          NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_stock_group_tenant" ON stock_groups (tenant_id)`);

    // ── shelves ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE shelves (
        id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        code        VARCHAR(50) NOT NULL,
        name        VARCHAR(100) NOT NULL,
        is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
        sort_order  INT         NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_shelf_tenant" ON shelves (tenant_id)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_shelf_tenant_code" ON shelves (tenant_id, code)
    `);

    // ── warehouses ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE warehouses (
        id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        code        VARCHAR(50) NOT NULL,
        name        VARCHAR(100) NOT NULL,
        address     TEXT,
        is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
        sort_order  INT         NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_warehouse_tenant" ON warehouses (tenant_id)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_warehouse_tenant_code" ON warehouses (tenant_id, code)
    `);

    // ── colors ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE colors (
        id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        code        VARCHAR(50) NOT NULL,
        name        VARCHAR(100) NOT NULL,
        hex_code    VARCHAR(10),
        is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
        sort_order  INT         NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_color_tenant" ON colors (tenant_id)`);

    // ── sizes ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE sizes (
        id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        code        VARCHAR(50) NOT NULL,
        name        VARCHAR(100) NOT NULL,
        is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
        sort_order  INT         NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_size_tenant" ON sizes (tenant_id)`);

    // ── cash_registers ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE cash_registers (
        id          UUID               NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id   UUID               NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        code        VARCHAR(50)        NOT NULL,
        name        VARCHAR(100)       NOT NULL,
        type        cash_register_type NOT NULL DEFAULT 'cash',
        is_active   BOOLEAN            NOT NULL DEFAULT TRUE,
        sort_order  INT                NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_cash_register_tenant" ON cash_registers (tenant_id)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_cash_register_tenant_code" ON cash_registers (tenant_id, code)
    `);

    // ── payment_types ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE payment_types (
        id                 UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id          UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        code               VARCHAR(50) NOT NULL,
        name               VARCHAR(100) NOT NULL,
        commission_bps     INT         NOT NULL DEFAULT 0,
        cash_register_id   UUID        REFERENCES cash_registers(id) ON DELETE SET NULL,
        is_active          BOOLEAN     NOT NULL DEFAULT TRUE,
        sort_order         INT         NOT NULL DEFAULT 0,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_payment_type_tenant" ON payment_types (tenant_id)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_payment_type_tenant_code" ON payment_types (tenant_id, code)
    `);

    // ── stock_movements ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE stock_movements (
        id               UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id        UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        document_number  VARCHAR(30)   NOT NULL,
        movement_type    movement_type NOT NULL,
        description      TEXT,
        in_warehouse_id  UUID          REFERENCES warehouses(id) ON DELETE SET NULL,
        out_warehouse_id UUID          REFERENCES warehouses(id) ON DELETE SET NULL,
        personnel_name   VARCHAR(255),
        occurred_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_stock_movement_tenant" ON stock_movements (tenant_id)`);
    await queryRunner.query(`CREATE INDEX "idx_stock_movement_tenant_type" ON stock_movements (tenant_id, movement_type)`);
    await queryRunner.query(`CREATE INDEX "idx_stock_movement_tenant_date" ON stock_movements (tenant_id, occurred_at DESC)`);

    // ── stock_movement_lines ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE stock_movement_lines (
        id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        movement_id      UUID         NOT NULL REFERENCES stock_movements(id) ON DELETE CASCADE,
        tenant_id        UUID         NOT NULL,
        product_id       UUID         REFERENCES products(id) ON DELETE SET NULL,
        product_name     VARCHAR(255) NOT NULL,
        product_barcode  VARCHAR(100),
        quantity         INT          NOT NULL CHECK (quantity > 0),
        unit_price_cents INT          NOT NULL DEFAULT 0,
        tax_rate_bps     INT          NOT NULL DEFAULT 0,
        line_total_cents INT          NOT NULL DEFAULT 0,
        sort_order       INT          NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_sml_movement" ON stock_movement_lines (movement_id)`);
    await queryRunner.query(`CREATE INDEX "idx_sml_product"  ON stock_movement_lines (product_id)`);

    // ── price_changes ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE price_changes (
        id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        document_number  VARCHAR(30) NOT NULL,
        description      TEXT,
        personnel_name   VARCHAR(255),
        occurred_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_price_change_tenant" ON price_changes (tenant_id)`);
    await queryRunner.query(`CREATE INDEX "idx_price_change_tenant_date" ON price_changes (tenant_id, occurred_at DESC)`);

    // ── price_change_lines ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE price_change_lines (
        id                   UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        price_change_id      UUID         NOT NULL REFERENCES price_changes(id) ON DELETE CASCADE,
        tenant_id            UUID         NOT NULL,
        product_id           UUID         REFERENCES products(id) ON DELETE SET NULL,
        product_name         VARCHAR(255) NOT NULL,
        product_barcode      VARCHAR(100),
        old_price_cents      INT          NOT NULL,
        new_price_cents      INT          NOT NULL,
        purchase_price_cents INT          NOT NULL DEFAULT 0,
        tax_rate_bps         INT          NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_pcl_price_change" ON price_change_lines (price_change_id)`);
    await queryRunner.query(`CREATE INDEX "idx_pcl_product"       ON price_change_lines (product_id)`);

    // ── Product enhancements ──────────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE products ADD COLUMN purchase_price_cents INT`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN price_cents_2 INT`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN price_cents_3 INT`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN price_cents_4 INT`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN unit_id UUID REFERENCES units(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN stock_group_id UUID REFERENCES stock_groups(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN shelf_id UUID REFERENCES shelves(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN manufacturer_name VARCHAR(255)`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN extra_barcodes JSONB NOT NULL DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN custom_field_1 VARCHAR(255)`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN custom_field_2 VARCHAR(255)`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN custom_field_3 VARCHAR(255)`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN custom_field_4 VARCHAR(255)`);
    await queryRunner.query(`ALTER TABLE products ADD COLUMN custom_field_5 VARCHAR(255)`);

    // ── updated_at triggers for new tables ────────────────────────────────
    for (const table of [
      'vat_rates', 'units', 'stock_groups', 'shelves', 'warehouses',
      'colors', 'sizes', 'cash_registers', 'payment_types',
      'stock_movements', 'price_changes',
    ]) {
      await queryRunner.query(`
        CREATE TRIGGER trg_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove product columns
    for (const col of [
      'purchase_price_cents', 'price_cents_2', 'price_cents_3', 'price_cents_4',
      'unit_id', 'stock_group_id', 'shelf_id', 'manufacturer_name',
      'extra_barcodes', 'custom_field_1', 'custom_field_2', 'custom_field_3',
      'custom_field_4', 'custom_field_5',
    ]) {
      await queryRunner.query(`ALTER TABLE products DROP COLUMN IF EXISTS ${col}`);
    }

    for (const table of [
      'price_change_lines', 'price_changes',
      'stock_movement_lines', 'stock_movements',
      'payment_types', 'cash_registers',
      'sizes', 'colors', 'warehouses', 'shelves',
      'stock_groups', 'units', 'vat_rates',
    ]) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }

    await queryRunner.query(`DROP TYPE IF EXISTS movement_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS cash_register_type`);
  }
}
