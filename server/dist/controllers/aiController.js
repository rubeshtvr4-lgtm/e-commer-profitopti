import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Return } from '../models/Return.js';
import { Shipment } from '../models/Shipment.js';
import { Expense } from '../models/Expense.js';
import { FinancialEngine } from '../services/financialEngine.js';
import { AiInsightsService } from '../services/aiService.js';
import { toRupees, calculateProfitMargin } from '../utils/currency.js';
export async function getAiInsights(req, res) {
    const ownerId = req.ownerId;
    const startDate = req.body?.startDate ? new Date(req.body.startDate) : undefined;
    const endDate = req.body?.endDate ? new Date(req.body.endDate) : undefined;
    const orderFilter = { ownerId };
    const expenseFilter = { ownerId };
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
        Return.find({ ownerId, status: { $ne: 'rejected' } }).lean(),
        Shipment.find({ ownerId }).lean(),
        Expense.find(expenseFilter).lean(),
        Product.find({ ownerId }).lean(),
    ]);
    const summary = FinancialEngine.calculateStoreSummary(orders, returns, shipments, expenses, { startDate, endDate });
    // Compute product ranking
    const productStats = new Map();
    for (const p of products) {
        productStats.set(p.SKU, { unitsSold: 0, revenuePaise: 0, costPaise: 0, returnedUnits: 0 });
    }
    for (const ord of orders) {
        if (ord.status === 'cancelled')
            continue;
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
            if (s)
                s.returnedUnits += item.quantity;
        }
    }
    const rankedProducts = products.map((p) => {
        const s = productStats.get(p.SKU) || { unitsSold: 0, revenuePaise: 0, costPaise: 0, returnedUnits: 0 };
        const netProfitPaise = s.revenuePaise - s.costPaise;
        const margin = calculateProfitMargin(netProfitPaise, s.revenuePaise);
        const returnRate = s.unitsSold > 0 ? Number(((s.returnedUnits / s.unitsSold) * 100).toFixed(1)) : 0;
        return {
            name: p.name,
            SKU: p.SKU,
            sellingPrice: toRupees(p.sellingPrice),
            unitCost: toRupees(p.unitCost),
            unitsSold: s.unitsSold,
            netProfit: toRupees(netProfitPaise),
            profitMargin: margin,
            returnRate,
        };
    });
    rankedProducts.sort((a, b) => b.unitsSold - a.unitsSold);
    // Return analytics
    const returnReasons = {};
    for (const r of returns) {
        returnReasons[r.returnReason] = (returnReasons[r.returnReason] || 0) + 1;
    }
    const returnAnalytics = {
        totalReturns: returns.length,
        totalRefunds: toRupees(returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0)),
        byReason: returnReasons,
    };
    // Expense analytics
    const expenseCategories = {};
    let totalExpensesPaise = 0;
    for (const exp of expenses) {
        const cat = exp.category || 'other';
        expenseCategories[cat] = (expenseCategories[cat] || 0) + exp.amount;
        totalExpensesPaise += exp.amount;
    }
    const expenseBreakdown = Object.entries(expenseCategories).map(([category, amt]) => ({
        category,
        amount: toRupees(amt),
        percentage: totalExpensesPaise > 0 ? Number(((amt / totalExpensesPaise) * 100).toFixed(1)) : 0,
    }));
    const insights = await AiInsightsService.generateInsights(summary, rankedProducts, returnAnalytics, expenseBreakdown);
    res.json({
        success: true,
        data: { insights },
    });
}
