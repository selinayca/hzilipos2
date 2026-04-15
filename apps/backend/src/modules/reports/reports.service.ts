import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface DailyRow {
  day: string;        // YYYY-MM-DD
  orderCount: number;
  revenueCents: number;
}

export interface TopProduct {
  productName: string;
  qty: number;
  revenueCents: number;
}

export interface PaymentBreakdown {
  paymentMethod: string;
  orderCount: number;
  revenueCents: number;
}

export interface ReportSummary {
  from: string;
  to: string;
  totalOrders: number;
  totalRevenueCents: number;
  averageOrderCents: number;
  byDay: DailyRow[];
  topProducts: TopProduct[];
  byPaymentMethod: PaymentBreakdown[];
}

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async getSummary(tenantId: string, from: Date, to: Date): Promise<ReportSummary> {
    // Daily breakdown
    const dailyRows = await this.dataSource.query<any[]>(
      `SELECT
         DATE_TRUNC('day', COALESCE(o.offline_created_at, o.created_at)) AS day,
         COUNT(*)::int AS "orderCount",
         COALESCE(SUM(o.total_cents), 0)::int AS "revenueCents"
       FROM orders o
       WHERE o.tenant_id = $1
         AND o.status = 'paid'
         AND COALESCE(o.offline_created_at, o.created_at) >= $2
         AND COALESCE(o.offline_created_at, o.created_at) <= $3
       GROUP BY day
       ORDER BY day`,
      [tenantId, from, to],
    );

    // Top products by qty
    const topProducts = await this.dataSource.query<any[]>(
      `SELECT
         oi.product_name AS "productName",
         SUM(oi.quantity)::int AS qty,
         SUM(oi.line_total_cents)::int AS "revenueCents"
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.tenant_id = $1
         AND o.status = 'paid'
         AND COALESCE(o.offline_created_at, o.created_at) >= $2
         AND COALESCE(o.offline_created_at, o.created_at) <= $3
       GROUP BY oi.product_name
       ORDER BY qty DESC
       LIMIT 10`,
      [tenantId, from, to],
    );

    // Payment method breakdown
    const paymentBreakdown = await this.dataSource.query<any[]>(
      `SELECT
         o.payment_method AS "paymentMethod",
         COUNT(*)::int AS "orderCount",
         COALESCE(SUM(o.total_cents), 0)::int AS "revenueCents"
       FROM orders o
       WHERE o.tenant_id = $1
         AND o.status = 'paid'
         AND COALESCE(o.offline_created_at, o.created_at) >= $2
         AND COALESCE(o.offline_created_at, o.created_at) <= $3
       GROUP BY o.payment_method`,
      [tenantId, from, to],
    );

    const totalOrders = dailyRows.reduce((s, r) => s + r.orderCount, 0);
    const totalRevenueCents = dailyRows.reduce((s, r) => s + r.revenueCents, 0);

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
      totalOrders,
      totalRevenueCents,
      averageOrderCents: totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0,
      byDay: dailyRows.map((r) => ({
        day: new Date(r.day).toISOString().split('T')[0],
        orderCount: r.orderCount,
        revenueCents: r.revenueCents,
      })),
      topProducts,
      byPaymentMethod: paymentBreakdown,
    };
  }
}
