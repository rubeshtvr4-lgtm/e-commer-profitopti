import { Response } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Return } from '../models/Return.js';
import { Shipment } from '../models/Shipment.js';
import { Expense } from '../models/Expense.js';
import { FinancialEngine } from '../services/financialEngine.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { toRupees, calculateProfitMargin } from '../utils/currency.js';

export async function exportOrdersCsv(req: AuthenticatedRequest, res: Response): Promise<void> {
  const ownerId = req.ownerId!;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : null;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : null;
  const status = (req.query.status as string || '').trim();

  const filter: any = { ownerId };
  if (status && status !== 'all') filter.status = status;
  if (startDate || endDate) {
    filter.orderDate = {};
    if (startDate) filter.orderDate.$gte = startDate;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.orderDate.$lte = endOfDay;
    }
  }

  const orders = await Order.find(filter).sort({ orderDate: -1 }).lean();
  const orderIds = orders.map((o) => o._id);

  const [returns, shipments, expenses] = await Promise.all([
    Return.find({ ownerId, orderId: { $in: orderIds } }).lean(),
    Shipment.find({ ownerId, orderId: { $in: orderIds } }).lean(),
    Expense.find({ ownerId, orderId: { $in: orderIds } }).lean(),
  ]);

  const returnsMap = new Map<string, any[]>();
  returns.forEach((r) => {
    const k = r.orderId.toString();
    const l = returnsMap.get(k) || [];
    l.push(r);
    returnsMap.set(k, l);
  });

  const shipmentsMap = new Map<string, any[]>();
  shipments.forEach((s) => {
    const k = s.orderId.toString();
    const l = shipmentsMap.get(k) || [];
    l.push(s);
    shipmentsMap.set(k, l);
  });

  const expensesMap = new Map<string, any[]>();
  expenses.forEach((e) => {
    const k = e.orderId?.toString();
    if (k) {
      const l = expensesMap.get(k) || [];
      l.push(e);
      expensesMap.set(k, l);
    }
  });

  const headers = [
    'Order Number',
    'Date',
    'Channel',
    'Customer',
    'Status',
    'Payment Status',
    'Gross Merchandise Sales (INR)',
    'Discounts (INR)',
    'Net Revenue (INR)',
    'Adjusted COGS (INR)',
    'Seller Shipping (INR)',
    'Advertising Cost (INR)',
    'Net Profit (INR)',
    'Profit Margin (%)',
  ];

  const rows: string[] = [headers.join(',')];

  for (const ord of orders) {
    const k = ord._id.toString();
    const f = FinancialEngine.calculateOrderFinancials(
      ord as any,
      returnsMap.get(k) || [],
      shipmentsMap.get(k) || [],
      expensesMap.get(k) || []
    );

    const row = [
      `"${ord.orderNumber}"`,
      `"${new Date(ord.orderDate).toISOString().split('T')[0]}"`,
      `"${ord.channel}"`,
      `"${ord.customer?.name || 'Anonymous'}"`,
      `"${ord.status}"`,
      `"${ord.paymentStatus}"`,
      f.grossMerchandiseSales.toFixed(2),
      toRupees(ord.discountAmount).toFixed(2),
      f.netRevenue.toFixed(2),
      f.adjustedProductCost.toFixed(2),
      f.sellerPaidShippingPaise ? toRupees(f.sellerPaidShippingPaise).toFixed(2) : '0.00',
      f.advertisingCostPaise ? toRupees(f.advertisingCostPaise).toFixed(2) : '0.00',
      f.netProfit.toFixed(2),
      `${f.profitMargin.toFixed(2)}%`,
    ];
    rows.push(row.join(','));
  }

  const csvContent = rows.join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="profitpilot-orders-${new Date().toISOString().split('T')[0]}.csv"`
  );
  res.status(200).send(csvContent);
}

export async function exportProfitabilityCsv(req: AuthenticatedRequest, res: Response): Promise<void> {
  const ownerId = req.ownerId!;
  const [products, orders, returns] = await Promise.all([
    Product.find({ ownerId }).lean(),
    Order.find({ ownerId, status: { $ne: 'cancelled' } }).lean(),
    Return.find({ ownerId, status: { $ne: 'rejected' } }).lean(),
  ]);

  const productStats = new Map<string, { unitsSold: number; revenuePaise: number; costPaise: number; returnedUnits: number }>();
  for (const p of products) {
    productStats.set(p.SKU, { unitsSold: 0, revenuePaise: 0, costPaise: 0, returnedUnits: 0 });
  }

  for (const ord of orders) {
    for (const item of ord.items) {
      const s = productStats.get(item.skuSnapshot);
      if (s) {
        s.unitsSold += item.quantity;
        s.revenuePaise += item.quantity * item.unitSalePrice;
        s.costPaise += item.quantity * item.unitCostSnapshot;
      }
    }
  }

  for (const ret of returns) {
    for (const item of ret.returnedItems) {
      const s = productStats.get(item.sku);
      if (s) s.returnedUnits += item.quantity;
    }
  }

  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Selling Price (INR)',
    'Unit Cost (INR)',
    'Stock Quantity',
    'Units Sold',
    'Units Returned',
    'Return Rate (%)',
    'Gross Revenue (INR)',
    'Total COGS (INR)',
    'Net Profit (INR)',
    'Profit Margin (%)',
  ];

  const rows: string[] = [headers.join(',')];

  for (const p of products) {
    const s = productStats.get(p.SKU) || { unitsSold: 0, revenuePaise: 0, costPaise: 0, returnedUnits: 0 };
    const netProfitPaise = s.revenuePaise - s.costPaise;
    const margin = calculateProfitMargin(netProfitPaise, s.revenuePaise);
    const returnRate = s.unitsSold > 0 ? Number(((s.returnedUnits / s.unitsSold) * 100).toFixed(1)) : 0;

    const row = [
      `"${p.SKU}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      toRupees(p.sellingPrice).toFixed(2),
      toRupees(p.unitCost).toFixed(2),
      p.stockQuantity,
      s.unitsSold,
      s.returnedUnits,
      `${returnRate}%`,
      toRupees(s.revenuePaise).toFixed(2),
      toRupees(s.costPaise).toFixed(2),
      toRupees(netProfitPaise).toFixed(2),
      `${margin.toFixed(2)}%`,
    ];
    rows.push(row.join(','));
  }

  const csvContent = rows.join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="profitpilot-profitability-${new Date().toISOString().split('T')[0]}.csv"`
  );
  res.status(200).send(csvContent);
}
