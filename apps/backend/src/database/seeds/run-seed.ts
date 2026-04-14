/**
 * Development seed script.
 *
 * Creates a demo tenant + admin user + cashier + categories + products.
 *
 * Run:  pnpm db:seed
 *
 * Idempotent — safe to run multiple times (skips if data exists).
 */
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { AppDataSource } from '../data-source';
import { Tenant, PlanTier } from '../entities/tenant.entity';
import { User, UserRole } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { Stock } from '../entities/stock.entity';

dotenv.config({ path: join(__dirname, '../../../.env') });

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱  Seeding database...');

  const tenantRepo   = AppDataSource.getRepository(Tenant);
  const userRepo     = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo  = AppDataSource.getRepository(Product);
  const stockRepo    = AppDataSource.getRepository(Stock);

  // ── Tenant ───────────────────────────────────────────────────────────
  let tenant = await tenantRepo.findOne({ where: { slug: 'demo' } });
  if (!tenant) {
    tenant = tenantRepo.create({
      slug: 'demo',
      name: 'Demo Market',
      planTier: PlanTier.STARTER,
      settings: { currency: 'TRY', taxRate: 0.18, locale: 'tr-TR' },
    });
    await tenantRepo.save(tenant);
    console.log('  ✓ Tenant: demo.example.com');
  }

  // ── Users ────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash('password123', 12);

  const adminExists = await userRepo.existsBy({ tenantId: tenant.id, email: 'admin@demo.com' });
  if (!adminExists) {
    await userRepo.save(userRepo.create({
      tenantId: tenant.id,
      email: 'admin@demo.com',
      name: 'Demo Admin',
      passwordHash: pw,
      role: UserRole.TENANT_ADMIN,
    }));
    console.log('  ✓ User: admin@demo.com / password123 (TENANT_ADMIN)');
  }

  const cashierExists = await userRepo.existsBy({ tenantId: tenant.id, email: 'cashier@demo.com' });
  if (!cashierExists) {
    await userRepo.save(userRepo.create({
      tenantId: tenant.id,
      email: 'cashier@demo.com',
      name: 'Demo Cashier',
      passwordHash: pw,
      role: UserRole.CASHIER,
    }));
    console.log('  ✓ User: cashier@demo.com / password123 (CASHIER)');
  }

  // ── Categories ────────────────────────────────────────────────────────
  const catData = [
    { name: 'Beverages', colorHex: '#3b82f6', sortOrder: 1 },
    { name: 'Snacks',    colorHex: '#f59e0b', sortOrder: 2 },
    { name: 'Dairy',     colorHex: '#10b981', sortOrder: 3 },
    { name: 'Bakery',    colorHex: '#f97316', sortOrder: 4 },
  ];

  const categories: Record<string, Category> = {};
  for (const c of catData) {
    let cat = await categoryRepo.findOne({ where: { tenantId: tenant.id, name: c.name } });
    if (!cat) {
      cat = await categoryRepo.save(categoryRepo.create({ tenantId: tenant.id, ...c }));
      console.log(`  ✓ Category: ${c.name}`);
    }
    categories[c.name] = cat;
  }

  // ── Products ──────────────────────────────────────────────────────────
  const productData = [
    { name: 'Coca-Cola 500ml',  barcode: '8690526040027', priceCents: 1500, taxRateBps: 1800, category: 'Beverages', stock: 100 },
    { name: 'Water 1.5L',       barcode: '8690526040034', priceCents:  500, taxRateBps: 1800, category: 'Beverages', stock: 200 },
    { name: 'Orange Juice 1L',  barcode: '8690526040041', priceCents: 2500, taxRateBps: 1800, category: 'Beverages', stock:  50 },
    { name: 'Chips BBQ 100g',   barcode: '8690526040058', priceCents: 2000, taxRateBps: 1800, category: 'Snacks',    stock:  80 },
    { name: 'Chocolate Bar',    barcode: '8690526040065', priceCents: 1200, taxRateBps: 1800, category: 'Snacks',    stock: 120 },
    { name: 'Milk 1L',          barcode: '8690526040072', priceCents: 3000, taxRateBps:  800, category: 'Dairy',     stock:  60 },
    { name: 'Yogurt 500g',      barcode: '8690526040089', priceCents: 2200, taxRateBps:  800, category: 'Dairy',     stock:  40 },
    { name: 'White Bread',      barcode: '8690526040096', priceCents: 2500, taxRateBps:  100, category: 'Bakery',    stock:  30 },
    { name: 'Croissant',        barcode: '8690526040103', priceCents: 1800, taxRateBps:  100, category: 'Bakery',    stock:  25 },
  ];

  for (const p of productData) {
    const exists = await productRepo.existsBy({ tenantId: tenant.id, barcode: p.barcode });
    if (!exists) {
      const product = await productRepo.save(productRepo.create({
        tenantId: tenant.id,
        categoryId: categories[p.category].id,
        name: p.name,
        barcode: p.barcode,
        priceCents: p.priceCents,
        taxRateBps: p.taxRateBps,
        trackStock: true,
        isActive: true,
      }));
      await stockRepo.save(stockRepo.create({
        tenantId: tenant.id,
        productId: product.id,
        quantity: p.stock,
        lowStockThreshold: 10,
      }));
      console.log(`  ✓ Product: ${p.name} (${(p.priceCents / 100).toFixed(2)} TRY)`);
    }
  }

  await AppDataSource.destroy();
  console.log('\n✅  Seed complete.');
  console.log('   Tenant POS URL: http://demo.localhost:3000');
  console.log('   Admin login:    admin@demo.com / password123');
  console.log('   Cashier login:  cashier@demo.com / password123');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
