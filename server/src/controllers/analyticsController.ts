import { Response } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Return } from '../models/Return.js';
import { Shipment } from '../models/Shipment.js';
import { Expense } from '../models/Expense.js';
import { FinancialEngine } from '../services/financialEngine.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { toRupees, calculateProfitMargin } from '../utils/currency.js';

export async function getOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
  const ownerId = req.ownerId!;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const orderFilter: any = { ownerId };
  const expenseFilter: any = { ownerId };

  if (startDate || endDate) {
    orderFilter.orderDate = {};
    expenseFilter.date = {};
    if (startDate) {
      orderFilter.orderDate.$gte = startDate;
      expenseFilter.date.$gte = startDate;
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      orderFilter.orderDate.$lte = endOfDay;
      expenseFilter.date.$lte = endOfDay;
    }
  }

  const [orders, returns, shipments, expenses, products] = await Promise.all([
    Order.find(orderFilter).lean(),
    Return.find({ ownerId }).lean(),
    Shipment.find({ ownerId }).lean(),
    Expense.find(expenseFilter).lean(),
    Product.find({ ownerId, active: true }).lean(),
  ]);

  const summary = FinancialEngine.calculateStoreSummary(
    orders as any,
    returns as any,
    shipments as any,
    expenses as any,
    { startDate, endDate }
  );

  // Compute low margin warnings (products with margin < 15%)
  const lowMarginProducts = products
    .filter((p) => {
      const margin = calculateProfitMargin(p.sellingPrice - p.unitCost, p.sellingPrice);
      return margin < 15;
    })
    .map((p) => ({
      id: p._id,
      name: p.name,
      SKU: p.SKU,
      sellingPrice: toRupees(p.sellingPrice),
      unitCost: toRupees(p.unitCost),
      margin: calculateProfitMargin(p.sellingPrice - p.unitCost, p.sellingPrice),
      stockQuantity: p.stockQuantity,
    }));

  // Low stock warnings
  const lowStockProducts = products
    .filter((p) => p.stockQuantity <= 5)
    .map((p) => ({
      id: p._id,
      name: p.name,
      SKU: p.SKU,
      stockQuantity: p.stockQuantity,
    }));

  res.json({
    success: true,
    data: {
      summary,
      alerts: {
        lowMarginProducts,
        lowStockProducts,
      },
    },
  });
}

export async function getTrends(req: AuthenticatedRequest, res: Response): Promise<void> {
  const ownerId = req.ownerId!;
  const days = Math.min(365, Math.max(7, parseInt(req.query.days as string) || 30));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const [orders, returns, shipments, expenses] = await Promise.all([
    Order.find({ ownerId, orderDate: { $gte: cutoff } }).sort({ orderDate: 1 }).lean(),
    Return.find({ ownerId, returnDate: { $gte: cutoff } }).lean(),
    Shipment.find({ ownerId }).lean(),
    Expense.find({ ownerId, date: { $gte: cutoff } }).lean(),
  ]);

  // Group by date (YYYY-MM-DD)
  const dateMap = new Map<
    string,
    {
      date: string;
      orders: any[];
      returns: any[];
      shipments: any[];
      expenses: any[];
    }
  >();

  // Initialize days
  for (let d = 0; d <= days; d++) {
    const dt = new Date(cutoff);
    dt.setDate(dt.getDate() + d);
    const key = dt.toISOString().split('T')[0];
    dateMap.set(key, { date: key, orders: [], returns: [], shipments: [], expenses: [] });
  }

  for (const ord of orders) {
    const key = new Date(ord.orderDate).toISOString().split('T')[0];
    if (dateMap.has(key)) {
      dateMap.get(key)!.orders.push(ord);
    }
  }

  for (const r of returns) {
    const key = new Date(r.returnDate).toISOString().split('T')[0];
    if (dateMap.has(key)) {
      dateMap.get(key)!.returns.push(r);
    }
  }

  for (const e of expenses) {
    const key = new Date(e.date).toISOString().split('T')[0];
    if (dateMap.has(key)) {
      dateMap.get(key)!.expenses.push(e);
    }
  }

  const trends = Array.from(dateMap.values()).map((entry) => {
    const storeSummary = FinancialEngine.calculateStoreSummary(
      entry.orders as any,
      entry.returns as any,
      shipments as any,
      entry.expenses as any
    );

    return {
      date: entry.date,
      orderCount: entry.orders.length,
      revenue: storeSummary.netRevenue,
      productCost: storeSummary.totalProductCost,
      shippingCost: storeSummary.totalShipping,
      advertisingCost: storeSummary.totalAdvertising,
      overhead: storeSummary.totalOverhead,
      netProfit: storeSummary.netProfit,
      profitMargin: storeSummary.profitMargin,
    };
  });

  res.json({
    success: true,
    data: { trends },
  });
}

export async function getProductPerformance(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const ownerId = req.ownerId!;
  const [products, orders, returns] = await Promise.all([
    Product.find({ ownerId }).lean(),
    Order.find({ ownerId, status: { $ne: 'cancelled' } }).lean(),
    Return.find({ ownerId, status: { $ne: 'rejected' } }).lean(),
  ]);

  const productStats = new Map<
    string,
    {
      unitsSold: number;
      grossRevenuePaise: number;
      totalCostPaise: number;
      unitsReturned: number;
      returnsCostPaise: number;
    }
  >();

  for (const p of products) {
    productStats.set(p.SKU, {
      unitsSold: 0,
      grossRevenuePaise: 0,
      totalCostPaise: 0,
      unitsReturned: 0,
      returnsCostPaise: 0,
    });
  }

  for (const ord of orders) {
    for (const item of ord.items) {
      const stats = productStats.get(item.skuSnapshot);
      if (stats) {
        stats.unitsSold += item.quantity;
        stats.grossRevenuePaise += item.quantity * item.unitSalePrice;
        stats.totalCostPaise += item.quantity * item.unitCostSnapshot;
      }
    }
  }

  for (const ret of returns) {
    for (const item of ret.returnedItems) {
      const stats = productStats.get(item.sku);
      if (stats) {
        stats.unitsReturned += item.quantity;
        stats.returnsCostPaise += item.quantity * item.unitCostSnapshot;
      }
    }
  }

  const results = products.map((p) => {
    const stats = productStats.get(p.SKU) || {
      unitsSold: 0,
      grossRevenuePaise: 0,
      totalCostPaise: 0,
      unitsReturned: 0,
      returnsCostPaise: 0,
    };

    const netProfitPaise = stats.grossRevenuePaise - stats.totalCostPaise;
    const margin = calculateProfitMargin(netProfitPaise, stats.grossRevenuePaise);
    const returnRate =
      stats.unitsSold > 0 ? Number(((stats.unitsReturned / stats.unitsSold) * 100).toFixed(1)) : 0;

    return {
      id: p._id,
      name: p.name,
      SKU: p.SKU,
      category: p.category,
      sellingPrice: toRupees(p.sellingPrice),
      unitCost: toRupees(p.unitCost),
      stockQuantity: p.stockQuantity,
      unitsSold: stats.unitsSold,
      unitsReturned: stats.unitsReturned,
      returnRate,
      grossRevenue: toRupees(stats.grossRevenuePaise),
      totalCost: toRupees(stats.totalCostPaise),
      netProfit: toRupees(netProfitPaise),
      profitMargin: margin,
    };
  });

  // Sort by net profit descending
  results.sort((a, b) => b.netProfit - a.netProfit);

  res.json({
    success: true,
    data: { products: results },
  });
}

export async function getReturnAnalytics(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const ownerId = req.ownerId!;
  const returns = await Return.find({ ownerId, status: { $ne: 'rejected' } }).lean();

  const reasonCounts: Record<string, number> = {};
  const conditionCounts: Record<string, number> = {};
  const recoveryCounts: Record<string, number> = {};
  let totalRefundsPaise = 0;
  let totalReverseShippingPaise = 0;

  for (const r of returns) {
    reasonCounts[r.returnReason] = (reasonCounts[r.returnReason] || 0) + 1;
    conditionCounts[r.returnedCondition] = (conditionCounts[r.returnedCondition] || 0) + 1;
    recoveryCounts[r.inventoryRecoveryStatus] =
      (recoveryCounts[r.inventoryRecoveryStatus] || 0) + 1;
    totalRefundsPaise += r.refundAmount || 0;
    totalReverseShippingPaise += r.reverseShippingCost || 0;
  }

  res.json({
    success: true,
    data: {
      totalReturns: returns.length,
      totalRefunds: toRupees(totalRefundsPaise),
      totalReverseShipping: toRupees(totalReverseShippingPaise),
      byReason: reasonCounts,
      byCondition: conditionCounts,
      byRecoveryStatus: recoveryCounts,
    },
  });
}

export async function getExpenseAnalytics(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const ownerId = req.ownerId!;
  const expenses = await Expense.find({ ownerId }).lean();

  const byCategory: Record<string, number> = {};
  let totalExpensesPaise = 0;

  for (const exp of expenses) {
    const cat = exp.category || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
    totalExpensesPaise += exp.amount;
  }

  const categoryBreakdown = Object.entries(byCategory).map(([category, amountPaise]) => ({
    category,
    amount: toRupees(amountPaise),
    percentage:
      totalExpensesPaise > 0
        ? Number(((amountPaise / totalExpensesPaise) * 100).toFixed(1))
        : 0,
  }));

  res.json({
    success: true,
    data: {
      totalExpenses: toRupees(totalExpensesPaise),
      categories: categoryBreakdown,
    },
  });
}
