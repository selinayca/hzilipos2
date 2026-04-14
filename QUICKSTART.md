# HizliPOS — Quick Start Guide

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker + Docker Compose

---

## 1. Clone & install

```bash
git clone <your-repo>
cd hizlipos
pnpm install
```

---

## 2. Start infrastructure (Postgres + Redis)

```bash
docker compose -f docker-compose.dev.yml up -d
```

Postgres is now available at `localhost:5432`.  
Redis at `localhost:6379`.

---

## 3. Configure environment

```bash
cp .env.example .env
```

Minimum required values in `.env`:

```env
DB_PASS=hizlipos_secret
JWT_SECRET=your_random_secret_min_32_chars
JWT_REFRESH_SECRET=another_random_secret_min_32_chars
```

---

## 4. Run database migrations + seed

```bash
# Create all tables
pnpm db:migrate

# Seed demo data (tenant, users, products)
pnpm db:seed
```

Seed creates:
| What | Value |
|---|---|
| Tenant subdomain | `demo` |
| Admin login | `admin@demo.com` / `password123` |
| Cashier login | `cashier@demo.com` / `password123` |
| Products | 9 demo products across 4 categories |

---

## 5. Start all apps

```bash
pnpm dev
```

| App | URL |
|---|---|
| Backend API | http://localhost:3001 |
| API Docs (Swagger) | http://localhost:3001/api/docs |
| POS Web | http://localhost:3000 |
| Backoffice | http://localhost:3002 |

> **Note:** The POS resolves the tenant from the subdomain in production.  
> In local dev, add `X-Tenant-ID: <tenant-uuid>` header, or use the demo
> tenant's UUID directly. You can retrieve it with:
> ```bash
> curl http://localhost:3001/api/v1/health   # check backend is up
> ```

---

## 6. Production deployment (Phase 1 — single VPS)

```bash
# Copy and fill in production .env
cp .env.example .env
# Edit .env with production values

# Build + start all containers
docker compose up -d --build

# Run migrations inside the container
docker compose exec backend pnpm migration:run
```

NGINX listens on 80/443. Configure your DNS:
```
A  api.example.com   → <server-ip>
A  app.example.com   → <server-ip>
A  *.example.com     → <server-ip>
```

For TLS (Let's Encrypt):
```bash
docker run --rm -v certbot_certs:/etc/letsencrypt \
  -v certbot_www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path /var/www/certbot \
  -d example.com -d "*.example.com"
```

---

## Project structure

```
hizlipos/
├── apps/
│   ├── backend/        NestJS API (port 3001)
│   ├── pos-web/        POS PWA — Next.js (port 3000)
│   └── backoffice/     Admin panel — Next.js (port 3002)
├── packages/
│   └── types/          Shared TypeScript types
├── infra/
│   └── nginx/          NGINX reverse proxy config
├── docker-compose.yml          Production
└── docker-compose.dev.yml      Development (infra only)
```

---

## Useful commands

```bash
# Run only backend in dev
pnpm --filter @hizlipos/backend dev

# Run only POS
pnpm --filter @hizlipos/pos-web dev

# Generate a new migration after entity changes
pnpm db:generate -- src/database/migrations/YourMigrationName

# Type-check all packages
pnpm typecheck
```

---

## Architecture decisions

| Decision | Reason |
|---|---|
| Shared DB + `tenant_id` | Simpler ops at this scale |
| Integer cents (no floats) | No rounding errors in totals |
| Offline-first IndexedDB | POS works with bad/no internet |
| `offlineSyncId` idempotency | Safe to retry failed submissions |
| Product `version` cursor | Incremental sync, not full reload |
| JWT in-memory + httpOnly refresh | XSS can't steal tokens |
| Modular monolith | Right size for MVP; split later when needed |
