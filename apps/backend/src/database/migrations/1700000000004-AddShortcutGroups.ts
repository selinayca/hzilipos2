import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShortcutGroups1700000000004 implements MigrationInterface {
  name = 'AddShortcutGroups1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE shortcut_groups (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name         VARCHAR(100) NOT NULL,
        color_hex    VARCHAR(7),
        sort_order   INT NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_shortcut_group_tenant ON shortcut_groups (tenant_id)
    `);

    await queryRunner.query(`
      CREATE TABLE shortcut_group_items (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id          UUID NOT NULL,
        shortcut_group_id  UUID NOT NULL REFERENCES shortcut_groups(id) ON DELETE CASCADE,
        product_id         UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sort_order         INT NOT NULL DEFAULT 0
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_shortcut_item_group  ON shortcut_group_items (shortcut_group_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_shortcut_item_tenant ON shortcut_group_items (tenant_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS shortcut_group_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS shortcut_groups`);
  }
}
