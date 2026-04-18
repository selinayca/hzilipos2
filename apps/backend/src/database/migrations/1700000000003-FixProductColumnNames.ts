import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProductColumnNames1700000000003 implements MigrationInterface {
  name = 'FixProductColumnNames1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migration 002 used price_cents_2 / custom_field_1 naming,
    // but the SnakeCaseNamingStrategy maps priceCents2 → price_cents2
    // and customField1 → custom_field1. Rename to match the entity.
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN price_cents_2 TO price_cents2`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN price_cents_3 TO price_cents3`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN price_cents_4 TO price_cents4`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN custom_field_1 TO custom_field1`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN custom_field_2 TO custom_field2`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN custom_field_3 TO custom_field3`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN custom_field_4 TO custom_field4`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN custom_field_5 TO custom_field5`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN price_cents2 TO price_cents_2`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN price_cents3 TO price_cents_3`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN price_cents4 TO price_cents_4`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN custom_field1 TO custom_field_1`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN custom_field2 TO custom_field_2`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN custom_field3 TO custom_field_3`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN custom_field4 TO custom_field_4`);
    await queryRunner.query(`ALTER TABLE products RENAME COLUMN custom_field5 TO custom_field_5`);
  }
}
