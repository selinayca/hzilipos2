import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeCaseNamingStrategy } from './snake-case-naming.strategy';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'hizlipos'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME', 'hizlipos_dev'),
        namingStrategy: new SnakeCaseNamingStrategy(),
        // Load entities from all registered modules — no manual list needed
        autoLoadEntities: true,
        // NEVER enable synchronize in production. Use migrations.
        synchronize: config.get<string>('DB_SYNC') === 'true',
        logging: config.get<string>('DB_LOGGING') === 'true',
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: false,
        // Connection pool tuning
        extra: {
          max: 20,       // max pool connections
          min: 2,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        },
        // Ensure UTC for all timestamps
        timezone: 'UTC',
      }),
    }),
  ],
})
export class DatabaseModule {}
