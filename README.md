# HizliPOS — Architecture Reference

> Last updated: 2026-04-19

---

## Table of Contents

1. [Overview](#1-overview)
2. [What Was Removed](#2-what-was-removed)
3. [Repository Structure](#3-repository-structure)
4. [Multi-Tenant Hierarchy](#4-multi-tenant-hierarchy)
5. [Database Design](#5-database-design)
6. [API Design](#6-api-design)
7. [POS Terminal Authentication](#7-pos-terminal-authentication)
8. [Sales Sync — Idempotency & Offline Support](#8-sales-sync--idempotency--offline-support)
9. [Backoffice (Admin UI)](#9-backoffice-admin-ui)
10. [Deployment](#10-deployment)

---

## 1. Overview

HizliPOS is a multi-tenant POS SaaS. The architecture consists of:

| Layer | Technology | Purpose |
|---|---|---|
| Backend API | NestJS + TypeORM + PostgreSQL | Business logic, persistence, REST API |
| Backoffice | Next.js (App Router) | Web admin panel for tenant managers |
| POS Terminals | Any HTTP client | External hardware/software that submits sales |

Physical POS terminals (or any device running POS software) communicate with the backend via a lightweight REST API authenticated with per-terminal API keys. The backend is the single source of truth.

---

## 2. What Was Removed

**`apps/pos-web`** — a Next.js web-based POS frontend — has been permanently removed.

**Reason:** The system is now designed around external POS hardware/software that integrates over the REST API rather than a browser-based POS. This simplifies the architecture (one less frontend to maintain), removes a security surface (no browser sessions for POS terminals), and makes it easier to support diverse terminal hardware.

**What replaced it:** The `POST /api/v1/sales` endpoint (described below) is the integration point for all POS terminals, regardless of what software they run.

---

## 3. Repository Structure

```
hizlipos/
├── apps/
│   ├── backend/          # NestJS REST API
│   └── backoffice/       # Next.js admin dashboard
├── packages/
│   └── types/            # Shared TypeScript types (API response shapes)
├── docker-compose.yml
├── docker-compose.prod.yml
└── ARCHITECTURE.md       # this file
```

The monorepo is managed with **pnpm workspaces** and **Turborepo**.

---

## 4. Multi-Tenant Hierarchy

```
Company (= Tenant)
└── Store  (1..n per company)
    └── Terminal  (1..n per store)
```

- **Company** maps to the existing `Tenant` entity (no rename — too many downstream effects). In the API, `tenantId` and `companyId` are interchangeable concepts.
- **Store** is a physical or logical location (e.g., "Downtown Branch", "Warehouse #2").
- **Terminal** is an individual POS device or software instance registered to a store. Each terminal has its own API key.

All entities carry `tenantId` for row-level multi-tenancy. There is no cross-tenant data leakage possible at the query layer because every repository query is scoped with `.where('tenantId = :tid', { tid })`.

---

## 5. Database Design

### New tables (migration `1700000000005`)

#### `stores`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| tenant_id | uuid FK → tenants | required |
| name | varchar(100) | unique per tenant |
| address | text | nullable |
| phone | varchar(30) | nullable |
| email | varchar(100) | nullable |
| is_active | boolean | default true |
| sort_order | int | default 0 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `terminals`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| tenant_id | uuid FK → tenants | required |
| store_id | uuid FK → stores | required |
| name | varchar(100) | display name |
| api_key_hash | varchar(64) UNIQUE | SHA-256 of raw key |
| api_key_hint | varchar(6) | last 6 chars of raw key |
| is_active | boolean | default true |
| last_seen_at | timestamptz | nullable, updated async |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### New columns on `orders`
| Column | Type | Notes |
|---|---|---|
| store_id | uuid FK → stores | nullable (backoffice orders have no store) |
| terminal_id | uuid FK → terminals | nullable |
| offline_sync_id | uuid UNIQUE (partial) | client-generated idempotency key |
| offline_created_at | timestamptz | actual sale time on the device |

The `offline_sync_id` unique constraint is partial: `WHERE offline_sync_id IS NOT NULL`, so backoffice orders (which don't set it) don't interfere.

---

## 6. API Design

### Base URL
```
https://<your-domain>/api/v1
```

### Authentication

Two authentication schemes coexist:

| Scheme | Header | Used by |
|---|---|---|
| JWT Bearer | `Authorization: Bearer <token>` | Backoffice users (human login) |
| API Key | `X-Api-Key: hzp_<hex>` | POS terminals |

The `TenantMiddleware` (which resolves tenant from `X-Tenant-ID` header) is bypassed for `/api/v1/sales` routes — terminals don't send a tenant header; their tenant is derived from the API key.

### POS-relevant endpoints

#### Stores
```
GET    /api/v1/stores           List all stores for the company
POST   /api/v1/stores           Create a store
GET    /api/v1/stores/:id       Get a store
PATCH  /api/v1/stores/:id       Update a store
DELETE /api/v1/stores/:id       Delete a store
```

#### Terminals
```
GET    /api/v1/terminals        List terminals (optionally filter by storeId)
POST   /api/v1/terminals        Register a terminal → returns API key (shown ONCE)
GET    /api/v1/terminals/:id    Get terminal details
PATCH  /api/v1/terminals/:id    Update terminal (name, isActive, storeId)
DELETE /api/v1/terminals/:id    Remove terminal
POST   /api/v1/terminals/:id/rotate-key   Invalidate old key, generate new one
```

#### Sales (POS terminal endpoints — X-Api-Key auth)
```
POST   /api/v1/sales            Submit a sale (idempotent)
GET    /api/v1/sales            List POS sales for this company
GET    /api/v1/sales/:id        Get a single sale
```

---

## 7. POS Terminal Authentication

### Key format
```
hzp_<64 hex characters>   (total: 68 characters)
```
Generated as: `'hzp_' + randomBytes(32).toString('hex')`

### Storage
- The **raw key** is shown **once** at creation/rotation and never stored.
- The backend stores only the **SHA-256 hash** (`api_key_hash` column, 64 hex chars).
- The **hint** (last 6 characters) is stored for UI identification.

### Validation flow
```
Request with X-Api-Key header
  → ApiKeyGuard
  → hash the incoming key with SHA-256
  → SELECT terminal WHERE api_key_hash = ? AND is_active = true
  → attach terminal to request.terminal
  → fire-and-forget: UPDATE terminal SET last_seen_at = NOW()
  → route handler receives @CurrentTerminal() terminal
```

### Key rotation
Calling `POST /terminals/:id/rotate-key` atomically replaces `api_key_hash` and `api_key_hint`. The old key is immediately invalidated. The new raw key is returned once.

---

## 8. Sales Sync — Idempotency & Offline Support

### The problem

POS terminals operate in environments with unreliable connectivity. When a terminal submits a sale and the network drops before receiving the response, it cannot know whether the server processed the request. A naive retry would create duplicate sales.

### The solution: client-generated idempotency UUID

```
POS Terminal                          Backend
     │                                   │
     │  generate UUID, store locally     │
     │  ─────────────────────────────>   │
     │  POST /sales { id: "<uuid>", ... }│
     │                                   │  (network drop)
     │  ←─ no response ─────────────────│
     │                                   │
     │  retry with SAME uuid            │
     │  ─────────────────────────────>   │
     │  POST /sales { id: "<uuid>", ... }│
     │                                   │  already exists → return existing
     │  <── 201 + sale object ──────────│
```

### Implementation

1. The POS generates a UUID **before** sending.
2. The UUID is sent as `dto.id` in the request body.
3. The server checks `WHERE tenantId = ? AND offlineSyncId = dto.id`.
4. If found → return existing order (no duplicate created).
5. If not found → create order with `offlineSyncId = dto.id`.
6. A `UNIQUE` constraint on `(tenantId, offlineSyncId)` (partial, where not null) enforces this at the database level as a last line of defense.

### Offline-created sales

If a terminal operates fully offline and syncs later, it sends `clientCreatedAt` with the actual timestamp of the sale. This is stored as `offlineCreatedAt` on the order. The server's `createdAt` reflects when the record was inserted, while `offlineCreatedAt` reflects when the sale actually happened.

### Request body
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clientCreatedAt": "2026-04-19T14:30:00.000Z",
  "paymentMethod": "cash",
  "items": [
    {
      "productId": "...",
      "quantity": 2,
      "unitPriceCents": 1500,
      "discountCents": 0
    }
  ],
  "discountCents": 0,
  "cashTenderedCents": 5000,
  "notes": "optional"
}
```

### What the server does
1. Idempotency check (return existing if UUID seen before)
2. Load products from DB (validates they belong to the same tenant)
3. Check `isActive` and stock availability for each item
4. Compute line totals, tax (from product `taxRateBps`), change
5. Persist order + items + stock decrements in a single transaction
6. Return the full order with items

---

## 9. Backoffice (Admin UI)

The Next.js backoffice at `apps/backoffice` is the management interface for tenant admins. It authenticates via JWT (email/password login) and uses the `Authorization: Bearer` + `X-Tenant-ID` headers for all API calls.

Key features:
- Product catalog management (CRUD, bulk price/stock updates, insights)
- Order history
- Store and terminal management (register terminals, rotate keys)
- Reports and analytics
- Multi-currency display (TRY/USD/EUR/GBP) — stored as cents in the DB, formatted client-side

---

## 10. Deployment

### Single-server Docker Compose

```
┌─────────────────────────────────────┐
│  Docker host                        │
│                                     │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ postgres │  │  backend:3000    │ │
│  │          │  │  (NestJS)        │ │
│  └──────────┘  └──────────────────┘ │
│                ┌──────────────────┐ │
│                │  backoffice:3001  │ │
│                │  (Next.js)        │ │
│                └──────────────────┘ │
└─────────────────────────────────────┘
         ↑
   nginx / reverse proxy (optional)
```

### Environment variables (backend)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `PORT` | Backend port (default 3000) |

### Running migrations

Migrations are TypeORM migration files in `apps/backend/src/database/migrations/`. They run automatically on startup if `synchronize: false` and `migrationsRun: true` is set in the TypeORM config (recommended for production).

To run manually:
```bash
pnpm --filter backend exec typeorm migration:run -d src/database/data-source.ts
```

### First-time setup

1. Start PostgreSQL and run migrations
2. Register the first tenant via `POST /api/v1/auth/register-tenant`
3. Log in as the tenant admin via `POST /api/v1/auth/login`
4. Create a store via `POST /api/v1/stores`
5. Register a terminal via `POST /api/v1/terminals` → copy the API key
6. Configure the POS terminal hardware/software with the API key
7. The terminal can now submit sales to `POST /api/v1/sales`
