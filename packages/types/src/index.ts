/**
 * Shared TypeScript types — consumed by pos-web and backoffice.
 * Backend uses its own entity types directly; these mirror the API response shapes.
 */

// ── Tenant ────────────────────────────────────────────────────────────────

export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface TenantPublic {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  planTier: PlanTier;
  settings: Record<string, unknown>;
}

// ── User ──────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'tenant_admin' | 'cashier';

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
}

// ── Product ───────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  colorHex: string | null;
  sortOrder: number;
}

export interface StockInfo {
  quantity: number;
  lowStockThreshold: number;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string | null;
  category: Category | null;
  name: string;
  description: string | null;
  barcode: string | null;
  sku: string | null;
  priceCents: number;
  taxRateBps: number;
  imageUrl: string | null;
  isActive: boolean;
  trackStock: boolean;
  version: number;
  stock: StockInfo;
  createdAt: string;
  updatedAt: string;
}

// ── Order ─────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'paid' | 'refunded' | 'partial_refund' | 'void';
export type PaymentMethod = 'cash' | 'card' | 'mixed';

export interface OrderItem {
  id: string;
  productId: string | null;
  productName: string;
  productBarcode: string | null;
  unitPriceCents: number;
  taxRateBps: number;
  quantity: number;
  discountCents: number;
  lineTotalCents: number;
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  cashTenderedCents: number;
  changeCents: number;
  notes: string | null;
  cashier: UserPublic | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// ── API response envelope ─────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
