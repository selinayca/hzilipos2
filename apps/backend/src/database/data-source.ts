/**
 * Standalone DataSource for TypeORM CLI (migrations, seed scripts).
 * Not used by NestJS at runtime — that uses database.module.ts.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { SnakeCaseNamingStrategy } from './snake-case-naming.strategy';

// Try loading .env from multiple locations so this works whether the
// script is invoked from apps/backend or from the monorepo root.
// __dirname  = <root>/apps/backend/src/database  (when ts-node compiles inline)
// process.cwd() = <root>/apps/backend  (when pnpm runs the script)
dotenv.config({ path: join(process.cwd(), '../../.env') }); // monorepo root
dotenv.config({ path: join(process.cwd(), '.env') });       // apps/backend (fallback)

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'hizlipos',
  password: process.env.DB_PASS,
  database: process.env.DB_NAME ?? 'hizlipos_dev',
  namingStrategy: new SnakeCaseNamingStrategy(),
  entities: [join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [join(__dirname, './migrations/*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  logging: process.env.DB_LOGGING === 'true',
  synchronize: false,
});
