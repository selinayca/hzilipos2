import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { StockModule } from './modules/stock/stock.module';
import { UserModule } from './modules/user/user.module';
import { HealthModule } from './modules/health/health.module';
import { VatRateModule } from './modules/definitions/vat-rate/vat-rate.module';
import { UnitModule } from './modules/definitions/unit/unit.module';
import { StockGroupModule } from './modules/definitions/stock-group/stock-group.module';
import { ShelfModule } from './modules/definitions/shelf/shelf.module';
import { WarehouseModule } from './modules/definitions/warehouse/warehouse.module';
import { ColorModule } from './modules/definitions/color/color.module';
import { SizeModule } from './modules/definitions/size/size.module';
import { CashRegisterModule } from './modules/definitions/cash-register/cash-register.module';
import { PaymentTypeModule } from './modules/definitions/payment-type/payment-type.module';
import { StockMovementModule } from './modules/stock-movement/stock-movement.module';
import { PriceChangeModule } from './modules/price-change/price-change.module';
import { ShortcutGroupModule } from './modules/shortcut-group/shortcut-group.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    // ── Config (global) ───────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      // Check monorepo root first, then apps/backend for local overrides
      envFilePath: [
        join(process.cwd(), '../../.env.local'),
        join(process.cwd(), '../../.env'),
        '.env.local',
        '.env',
      ],
      cache: true,
    }),

    // ── Rate limiting ─────────────────────────────────────────────────────
    // 100 requests per 60 seconds per IP — tighten per-route as needed
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
      { name: 'auth', ttl: 60_000, limit: 10 }, // stricter for login endpoints
    ]),

    // ── Infrastructure ────────────────────────────────────────────────────
    DatabaseModule,

    // ── Feature modules ───────────────────────────────────────────────────
    HealthModule,
    AuthModule,
    TenantModule,
    ProductModule,
    OrderModule,
    StockModule,
    UserModule,

    // ── Definition modules ────────────────────────────────────────────────
    VatRateModule,
    UnitModule,
    StockGroupModule,
    ShelfModule,
    WarehouseModule,
    ColorModule,
    SizeModule,
    CashRegisterModule,
    PaymentTypeModule,

    // ── Operational modules ───────────────────────────────────────────────
    StockMovementModule,
    PriceChangeModule,
    ShortcutGroupModule,
    ReportsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        // Public endpoints that don't need tenant resolution
        { path: 'api/v1/health', method: RequestMethod.GET },
        { path: 'api/v1/auth/register-tenant', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
