import { describe, it, expect } from 'vitest';
import { FinancialEngine } from '../src/services/financialEngine.js';
import { toPaise, toRupees, calculateProfitMargin } from '../src/utils/currency.js';
import { IOrder } from '../src/models/Order.js';
import { IReturn } from '../src/models/Return.js';
import { IShipment } from '../src/models/Shipment.js';
import { IExpense } from '../src/models/Expense.js';
import mongoose from 'mongoose';

describe('FinancialEngine Unit Tests', () => {
  const sellerId = new mongoose.Types.ObjectId();

  it('correctly calculates normal delivered order with minor units (paise)', () => {
    // 2 units at ₹1000 each (unit cost ₹400), shipping charged ₹50, seller shipping ₹80, ad cost ₹100
    const mockOrder: Partial<IOrder> = {
      _id: new mongoose.Types.ObjectId() as any,
      orderNumber: 'ORD-101',
      orderDate: new Date(),
      status: 'delivered',
      items: [
        {
          nameSnapshot: 'Shirt',
          skuSnapshot: 'SHIRT-01',
          quantity: 2,
          unitSalePrice: toPaise(1000), // 100,000 paise each
          unitCostSnapshot: toPaise(400), // 40,000 paise each
        },
      ],
      shippingCost: toPaise(80),
      shippingChargedToCustomer: toPaise(50),
      discountAmount: 0,
      taxAmount: toPaise(100),
      advertisingCost: toPaise(100),
    };

    const result = FinancialEngine.calculateOrderFinancials(mockOrder as IOrder, [], [], []);

    // Gross Merchandise Sales = 2 * 1000 = 2000 INR = 200000 paise
    expect(result.grossMerchandiseSalesPaise).toBe(200000);
    expect(result.grossMerchandiseSales).toBe(2000);

    // Net Revenue = Net Merchandise Sales (2000) + Shipping Charged (50) = 2050 INR = 205000 paise
    expect(result.netRevenuePaise).toBe(205000);
    expect(result.netRevenue).toBe(2050);

    // Adjusted COGS = 2 * 400 = 800 INR = 80000 paise
    expect(result.adjustedProductCostPaise).toBe(80000);
    expect(result.adjustedProductCost).toBe(800);

    // Direct Costs = Shipping Paid (80) + Ad Cost (100) = 180 INR = 18000 paise
    expect(result.totalDirectCostsPaise).toBe(18000);

    // Net Profit = Net Revenue (2050) - COGS (800) - Direct Costs (180) = 1070 INR = 107000 paise
    expect(result.netProfitPaise).toBe(107000);
    expect(result.netProfit).toBe(1070);

    // Profit Margin = (1070 / 2050) * 100 = 52.2%
    expect(result.profitMarginPercent).toBe(52.2);
  });

  it('correctly handles discounts and taxes', () => {
    const mockOrder: Partial<IOrder> = {
      _id: new mongoose.Types.ObjectId() as any,
      orderNumber: 'ORD-102',
      orderDate: new Date(),
      status: 'delivered',
      items: [
        {
          nameSnapshot: 'Bag',
          skuSnapshot: 'BAG-01',
          quantity: 1,
          unitSalePrice: toPaise(1500),
          unitCostSnapshot: toPaise(600),
        },
      ],
      shippingCost: toPaise(70),
      shippingChargedToCustomer: 0,
      discountAmount: toPaise(200), // ₹200 discount coupon
      taxAmount: toPaise(180),
      advertisingCost: 0,
    };

    const result = FinancialEngine.calculateOrderFinancials(mockOrder as IOrder, [], [], []);

    // Net Merchandise Sales = 1500 - 200 = 1300
    expect(result.netMerchandiseSalesPaise).toBe(130000);
    expect(result.netRevenue).toBe(1300);
    // Net profit = 1300 - 600 - 70 = 630
    expect(result.netProfit).toBe(630);
  });

  it('correctly credits recovered inventory when return is resalable and restocked', () => {
    const orderId = new mongoose.Types.ObjectId();
    const mockOrder: Partial<IOrder> = {
      _id: orderId as any,
      orderNumber: 'ORD-103',
      orderDate: new Date(),
      status: 'returned',
      items: [
        {
          nameSnapshot: 'Shoes',
          skuSnapshot: 'SHOE-01',
          quantity: 1,
          unitSalePrice: toPaise(2000),
          unitCostSnapshot: toPaise(800),
        },
      ],
      shippingCost: toPaise(100),
      shippingChargedToCustomer: 0,
      discountAmount: 0,
      advertisingCost: toPaise(150),
    };

    const mockReturn: Partial<IReturn> = {
      orderId,
      returnedItems: [
        {
          sku: 'SHOE-01',
          name: 'Shoes',
          quantity: 1,
          unitCostSnapshot: toPaise(800),
        },
      ],
      refundAmount: toPaise(2000), // Full merchandise refund
      shippingRefundAmount: 0,
      reverseShippingCost: toPaise(90),
      inventoryRecoveryStatus: 'restocked',
      returnedCondition: 'resalable',
      status: 'completed',
    };

    const result = FinancialEngine.calculateOrderFinancials(
      mockOrder as IOrder,
      [mockReturn as IReturn],
      [],
      []
    );

    // Revenue is 0 after refund
    expect(result.netRevenuePaise).toBe(0);

    // Because item was restocked in resalable condition, COGS is recovered!
    expect(result.recoveredInventoryValuePaise).toBe(80000);
    expect(result.adjustedProductCostPaise).toBe(0);

    // Costs incurred are Forward Shipping (100) + Reverse Shipping (90) + Ad Spend (150) = 340
    expect(result.sellerPaidShippingPaise).toBe(10000);
    expect(result.reverseShippingCostPaise).toBe(9000);
    expect(result.netProfitPaise).toBe(-34000);
    expect(result.netProfit).toBe(-340);
  });

  it('does NOT credit recovered inventory when return is damaged or written off', () => {
    const orderId = new mongoose.Types.ObjectId();
    const mockOrder: Partial<IOrder> = {
      _id: orderId as any,
      orderNumber: 'ORD-104',
      orderDate: new Date(),
      status: 'returned',
      items: [
        {
          nameSnapshot: 'Ceramic Vase',
          skuSnapshot: 'VASE-01',
          quantity: 1,
          unitSalePrice: toPaise(1200),
          unitCostSnapshot: toPaise(500),
        },
      ],
      shippingCost: toPaise(120),
      shippingChargedToCustomer: 0,
      discountAmount: 0,
      advertisingCost: 0,
    };

    const mockReturn: Partial<IReturn> = {
      orderId,
      returnedItems: [
        {
          sku: 'VASE-01',
          name: 'Ceramic Vase',
          quantity: 1,
          unitCostSnapshot: toPaise(500),
        },
      ],
      refundAmount: toPaise(1200),
      reverseShippingCost: toPaise(80),
      inventoryRecoveryStatus: 'damaged_written_off', // DAMAGED!
      returnedCondition: 'damaged',
      status: 'completed',
    };

    const result = FinancialEngine.calculateOrderFinancials(
      mockOrder as IOrder,
      [mockReturn as IReturn],
      [],
      []
    );

    // COGS is NOT recovered because item was damaged
    expect(result.recoveredInventoryValuePaise).toBe(0);
    expect(result.adjustedProductCostPaise).toBe(50000); // 500 INR lost!

    // Loss = COGS (500) + Forward Shipping (120) + Reverse Shipping (80) = 700 INR loss
    expect(result.netProfit).toBe(-700);
  });

  it('handles cancelled orders pre-dispatch with zero revenue and zero COGS', () => {
    const mockOrder: Partial<IOrder> = {
      _id: new mongoose.Types.ObjectId() as any,
      orderNumber: 'ORD-105',
      orderDate: new Date(),
      status: 'cancelled',
      items: [
        {
          nameSnapshot: 'Jacket',
          skuSnapshot: 'JCK-01',
          quantity: 1,
          unitSalePrice: toPaise(3000),
          unitCostSnapshot: toPaise(1400),
        },
      ],
      shippingCost: 0,
      shippingChargedToCustomer: 0,
      discountAmount: 0,
      advertisingCost: 0,
    };

    const result = FinancialEngine.calculateOrderFinancials(mockOrder as IOrder, [], [], []);

    expect(result.netRevenuePaise).toBe(0);
    expect(result.adjustedProductCostPaise).toBe(0);
    expect(result.netProfitPaise).toBe(0);
    expect(result.profitMarginPercent).toBe(0);
  });

  it('safely handles zero revenue and zero margin calculations', () => {
    expect(calculateProfitMargin(0, 0)).toBe(0);
    expect(calculateProfitMargin(-500, 0)).toBe(-100);
    expect(calculateProfitMargin(250, 1000)).toBe(25);
  });

  it('prevents double-counting between order-linked expenses and store general overhead', () => {
    const orderId = new mongoose.Types.ObjectId();
    const mockOrder: Partial<IOrder> = {
      _id: orderId as any,
      orderNumber: 'ORD-106',
      orderDate: new Date(),
      status: 'delivered',
      items: [
        {
          nameSnapshot: 'Candle',
          skuSnapshot: 'CND-01',
          quantity: 1,
          unitSalePrice: toPaise(500),
          unitCostSnapshot: toPaise(150),
        },
      ],
      shippingCost: toPaise(50),
    };

    // One order-linked expense (custom gift packaging for this order)
    const orderLinkedExpense: Partial<IExpense> = {
      ownerId: sellerId,
      orderId,
      category: 'packaging',
      amount: toPaise(30),
      description: 'Gift wrap for ORD-106',
    };

    // One general store overhead expense (monthly accounting software)
    const storeGeneralExpense: Partial<IExpense> = {
      ownerId: sellerId,
      orderId: undefined, // unlinked!
      category: 'software',
      amount: toPaise(1000),
      description: 'Monthly SaaS subscription',
    };

    const summary = FinancialEngine.calculateStoreSummary(
      [mockOrder as IOrder],
      [],
      [],
      [orderLinkedExpense as IExpense, storeGeneralExpense as IExpense]
    );

    // Order expense is ₹30
    expect(summary.totalOrderExpensesPaise).toBe(3000);
    // General overhead is strictly ₹1000 (order expense is NOT duplicated here!)
    expect(summary.totalGeneralOverheadPaise).toBe(100000);

    // Revenue: 500. Product cost: 150. Shipping: 50. Order exp: 30. Overhead: 1000.
    // Net profit = 500 - 150 - 50 - 30 - 1000 = -730 INR (-73000 paise)
    expect(summary.netProfitPaise).toBe(-73000);
    expect(summary.netProfit).toBe(-730);
  });
});
