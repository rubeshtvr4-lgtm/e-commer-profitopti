import { IOrder } from '../models/Order.js';
import { IReturn } from '../models/Return.js';
import { IExpense } from '../models/Expense.js';
import { IShipment } from '../models/Shipment.js';
import { calculateProfitMargin, toRupees } from '../utils/currency.js';

export interface OrderFinancialBreakdown {
  orderId: string;
  orderNumber: string;
  orderDate: Date;
  status: string;
  grossMerchandiseSalesPaise: number;
  discountAmountPaise: number;
  merchandiseRefundsPaise: number;
  shippingRefundsPaise: number;
  netMerchandiseSalesPaise: number;
  shippingChargedToCustomerPaise: number;
  netRevenuePaise: number;
  taxAmountPaise: number;
  baselineProductCostPaise: number;
  recoveredInventoryValuePaise: number;
  adjustedProductCostPaise: number;
  sellerPaidShippingPaise: number;
  reverseShippingCostPaise: number;
  advertisingCostPaise: number;
  orderAttributableExpensesPaise: number;
  nonRecoveredReturnLossesPaise: number;
  totalDirectCostsPaise: number;
  netProfitPaise: number;
  profitMarginPercent: number;

  // Major currency unit representations for display
  grossMerchandiseSales: number;
  netRevenue: number;
  adjustedProductCost: number;
  netProfit: number;
  profitMargin: number;
}

export interface StoreFinancialSummary {
  period: {
    startDate?: Date;
    endDate?: Date;
  };
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  pendingOrders: number;
  returnRatePercent: number;

  grossMerchandiseSalesPaise: number;
  totalDiscountsPaise: number;
  totalRefundsPaise: number;
  netRevenuePaise: number;
  totalProductCostPaise: number;
  totalShippingPaidPaise: number;
  totalReverseShippingPaise: number;
  totalAdvertisingPaise: number;
  totalOrderExpensesPaise: number;
  totalGeneralOverheadPaise: number;
  totalDirectCostsPaise: number;
  totalCostAndExpensesPaise: number;
  netProfitPaise: number;
  profitMarginPercent: number;

  // Display values (major currency INR)
  grossMerchandiseSales: number;
  netRevenue: number;
  totalProductCost: number;
  totalShipping: number;
  totalAdvertising: number;
  totalOverhead: number;
  netProfit: number;
  profitMargin: number;
}

export class FinancialEngine {
  /**
   * Calculates precise financial metrics for a single order, considering
   * its items, associated returns, shipments, and order-attributable expenses.
   */
  public static calculateOrderFinancials(
    order: IOrder,
    returns: IReturn[] = [],
    shipments: IShipment[] = [],
    orderExpenses: IExpense[] = []
  ): OrderFinancialBreakdown {
    const isCancelled = order.status === 'cancelled';

    // 1. Gross Merchandise Sales
    let grossMerchandiseSalesPaise = 0;
    let baselineProductCostPaise = 0;

    for (const item of order.items) {
      grossMerchandiseSalesPaise += item.quantity * item.unitSalePrice;
      baselineProductCostPaise += item.quantity * item.unitCostSnapshot;
    }

    // 2. Returns & Refunds Calculation
    let merchandiseRefundsPaise = 0;
    let shippingRefundsPaise = 0;
    let reverseShippingCostPaise = 0;
    let recoveredInventoryValuePaise = 0;
    let damagedInventoryLossPaise = 0;

    for (const ret of returns) {
      if (ret.status === 'rejected') continue;

      merchandiseRefundsPaise += ret.refundAmount || 0;
      shippingRefundsPaise += ret.shippingRefundAmount || 0;
      reverseShippingCostPaise += ret.reverseShippingCost || 0;

      for (const retItem of ret.returnedItems) {
        const itemVal = retItem.quantity * retItem.unitCostSnapshot;
        if (
          ret.inventoryRecoveryStatus === 'restocked' &&
          (ret.returnedCondition === 'resalable' || ret.returnedCondition === 'unopened')
        ) {
          // Inventory was physically verified and restocked: recover the COGS
          recoveredInventoryValuePaise += itemVal;
        } else if (
          ret.inventoryRecoveryStatus === 'damaged_written_off' ||
          ret.returnedCondition === 'damaged' ||
          ret.returnedCondition === 'missing_parts'
        ) {
          // Inventory damaged: COGS is lost
          damagedInventoryLossPaise += itemVal;
        }
      }
    }

    // Also factor reverse shipping recorded on shipments if not already in returns
    for (const sh of shipments) {
      if (sh.reverseShippingCost && returns.length === 0) {
        reverseShippingCostPaise += sh.reverseShippingCost;
      }
    }

    // Handling Pre-dispatch Cancellations
    if (isCancelled) {
      // For cancelled orders, merchandise sales are zeroed out
      grossMerchandiseSalesPaise = 0;
      // If order was cancelled before dispatch (no shipments), COGS is zero because items were not shipped
      if (shipments.length === 0) {
        baselineProductCostPaise = 0;
        recoveredInventoryValuePaise = 0;
      }
    }

    // Cap merchandise refunds at gross merchandise sales
    merchandiseRefundsPaise = Math.min(merchandiseRefundsPaise, grossMerchandiseSalesPaise);

    // 3. Net Merchandise Sales
    const discountAmountPaise = order.discountAmount || 0;
    const netMerchandiseSalesPaise = Math.max(
      0,
      grossMerchandiseSalesPaise - discountAmountPaise - merchandiseRefundsPaise
    );

    // 4. Net Revenue = Net Merchandise Sales + Customer-paid shipping - shipping refunds
    const shippingChargedPaise = isCancelled ? 0 : (order.shippingChargedToCustomer || 0);
    const effectiveShippingCharged = Math.max(0, shippingChargedPaise - shippingRefundsPaise);
    const netRevenuePaise = netMerchandiseSalesPaise + effectiveShippingCharged;

    // 5. Adjusted Product Cost (COGS)
    // Adjusted COGS = baseline COGS minus value of recovered resalable stock
    const adjustedProductCostPaise = Math.max(
      0,
      baselineProductCostPaise - recoveredInventoryValuePaise
    );

    // 6. Direct Costs
    // Seller-paid forward shipping
    let sellerPaidShippingPaise = order.shippingCost || 0;
    if (shipments.length > 0 && sellerPaidShippingPaise === 0) {
      sellerPaidShippingPaise = shipments.reduce((sum, s) => sum + (s.shippingCost || 0), 0);
    }

    const advertisingCostPaise = order.advertisingCost || 0;

    // Order-attributable direct expenses (packaging, custom order labor, etc.)
    const orderAttributableExpensesPaise = orderExpenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );

    // Total direct attributable costs
    const nonRecoveredReturnLossesPaise = damagedInventoryLossPaise;
    const totalDirectCostsPaise =
      sellerPaidShippingPaise +
      reverseShippingCostPaise +
      advertisingCostPaise +
      orderAttributableExpensesPaise;

    // 7. Net Profit
    // Net Profit = Net Revenue - Product Cost - Direct Costs
    const netProfitPaise = netRevenuePaise - adjustedProductCostPaise - totalDirectCostsPaise;

    // 8. Profit Margin (%)
    const profitMarginPercent = calculateProfitMargin(netProfitPaise, netRevenuePaise);

    return {
      orderId: (order._id as any)?.toString() || '',
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      status: order.status,
      grossMerchandiseSalesPaise,
      discountAmountPaise,
      merchandiseRefundsPaise,
      shippingRefundsPaise,
      netMerchandiseSalesPaise,
      shippingChargedToCustomerPaise: shippingChargedPaise,
      netRevenuePaise,
      taxAmountPaise: order.taxAmount || 0,
      baselineProductCostPaise,
      recoveredInventoryValuePaise,
      adjustedProductCostPaise,
      sellerPaidShippingPaise,
      reverseShippingCostPaise,
      advertisingCostPaise,
      orderAttributableExpensesPaise,
      nonRecoveredReturnLossesPaise,
      totalDirectCostsPaise,
      netProfitPaise,
      profitMarginPercent,

      // Display values
      grossMerchandiseSales: toRupees(grossMerchandiseSalesPaise),
      netRevenue: toRupees(netRevenuePaise),
      adjustedProductCost: toRupees(adjustedProductCostPaise),
      netProfit: toRupees(netProfitPaise),
      profitMargin: profitMarginPercent,
    };
  }

  /**
   * Computes store-level financial summary across an array of orders,
   * returns, shipments, and general overhead expenses.
   * Guarantees that order-linked expenses are NOT double counted in store overhead!
   */
  public static calculateStoreSummary(
    orders: IOrder[],
    returns: IReturn[],
    shipments: IShipment[],
    allExpenses: IExpense[],
    dateRange?: { startDate?: Date; endDate?: Date }
  ): StoreFinancialSummary {
    // Map returns by orderId
    const returnsByOrder = new Map<string, IReturn[]>();
    for (const r of returns) {
      const orderIdStr = r.orderId.toString();
      const list = returnsByOrder.get(orderIdStr) || [];
      list.push(r);
      returnsByOrder.set(orderIdStr, list);
    }

    // Map shipments by orderId
    const shipmentsByOrder = new Map<string, IShipment[]>();
    for (const s of shipments) {
      const orderIdStr = s.orderId.toString();
      const list = shipmentsByOrder.get(orderIdStr) || [];
      list.push(s);
      shipmentsByOrder.set(orderIdStr, list);
    }

    // Map order-specific expenses and segregate general overhead expenses
    const expensesByOrder = new Map<string, IExpense[]>();
    let totalGeneralOverheadPaise = 0;

    for (const exp of allExpenses) {
      if (exp.orderId) {
        const orderIdStr = exp.orderId.toString();
        const list = expensesByOrder.get(orderIdStr) || [];
        list.push(exp);
        expensesByOrder.set(orderIdStr, list);
      } else {
        // Unlinked expense -> Store-level overhead (software, rent, creator sponsorship, etc.)
        totalGeneralOverheadPaise += exp.amount || 0;
      }
    }

    let grossMerchandiseSalesPaise = 0;
    let totalDiscountsPaise = 0;
    let totalRefundsPaise = 0;
    let netRevenuePaise = 0;
    let totalProductCostPaise = 0;
    let totalShippingPaidPaise = 0;
    let totalReverseShippingPaise = 0;
    let totalAdvertisingPaise = 0;
    let totalOrderExpensesPaise = 0;

    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let returnedOrders = 0;
    let pendingOrders = 0;

    const returnedOrderIds = new Set<string>();
    for (const r of returns) {
      if (r.status !== 'rejected') {
        returnedOrderIds.add(r.orderId.toString());
      }
    }

    for (const order of orders) {
      const orderIdStr = (order._id as any)?.toString() || '';
      const orderReturns = returnsByOrder.get(orderIdStr) || [];
      const orderShipments = shipmentsByOrder.get(orderIdStr) || [];
      const orderExps = expensesByOrder.get(orderIdStr) || [];

      const breakdown = this.calculateOrderFinancials(
        order,
        orderReturns,
        orderShipments,
        orderExps
      );

      grossMerchandiseSalesPaise += breakdown.grossMerchandiseSalesPaise;
      totalDiscountsPaise += breakdown.discountAmountPaise;
      totalRefundsPaise += breakdown.merchandiseRefundsPaise + breakdown.shippingRefundsPaise;
      netRevenuePaise += breakdown.netRevenuePaise;
      totalProductCostPaise += breakdown.adjustedProductCostPaise;
      totalShippingPaidPaise += breakdown.sellerPaidShippingPaise;
      totalReverseShippingPaise += breakdown.reverseShippingCostPaise;
      totalAdvertisingPaise += breakdown.advertisingCostPaise;
      totalOrderExpensesPaise += breakdown.orderAttributableExpensesPaise;

      // Status counters
      if (order.status === 'delivered') deliveredOrders++;
      else if (order.status === 'cancelled') cancelledOrders++;
      else if (order.status === 'returned' || returnedOrderIds.has(orderIdStr)) returnedOrders++;
      else pendingOrders++;
    }

    const totalOrders = orders.length;
    const returnRatePercent =
      totalOrders > 0 ? Number(((returnedOrders / totalOrders) * 100).toFixed(1)) : 0;

    const totalDirectCostsPaise =
      totalShippingPaidPaise +
      totalReverseShippingPaise +
      totalAdvertisingPaise +
      totalOrderExpensesPaise;

    const totalCostAndExpensesPaise =
      totalProductCostPaise + totalDirectCostsPaise + totalGeneralOverheadPaise;

    // Store-wide net profit = Net Revenue - Total COGS - Direct Costs - General Overhead
    const netProfitPaise = netRevenuePaise - totalCostAndExpensesPaise;
    const profitMarginPercent = calculateProfitMargin(netProfitPaise, netRevenuePaise);

    return {
      period: {
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
      },
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      returnedOrders,
      pendingOrders,
      returnRatePercent,

      grossMerchandiseSalesPaise,
      totalDiscountsPaise,
      totalRefundsPaise,
      netRevenuePaise,
      totalProductCostPaise,
      totalShippingPaidPaise,
      totalReverseShippingPaise,
      totalAdvertisingPaise,
      totalOrderExpensesPaise,
      totalGeneralOverheadPaise,
      totalDirectCostsPaise,
      totalCostAndExpensesPaise,
      netProfitPaise,
      profitMarginPercent,

      // Major units for charts and stats
      grossMerchandiseSales: toRupees(grossMerchandiseSalesPaise),
      netRevenue: toRupees(netRevenuePaise),
      totalProductCost: toRupees(totalProductCostPaise),
      totalShipping: toRupees(totalShippingPaidPaise + totalReverseShippingPaise),
      totalAdvertising: toRupees(totalAdvertisingPaise),
      totalOverhead: toRupees(totalGeneralOverheadPaise),
      netProfit: toRupees(netProfitPaise),
      profitMargin: profitMarginPercent,
    };
  }
}
