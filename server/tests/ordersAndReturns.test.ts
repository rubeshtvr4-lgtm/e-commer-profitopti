import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupMockDb } from './mockDb.js';

describe('Orders, Returns, Shipments & Analytics Integration Suite', () => {
  let app: any;
  let authToken: string;
  let productId: string;
  let orderId: string;
  let shipmentId: string;
  let expenseId: string;

  beforeAll(async () => {
    setupMockDb();
    app = createApp();

    // Register a merchant for this test suite
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Merchant Test',
        email: 'merchant.e2e@profitpilot.com',
        password: 'PasswordSecure123!',
        businessName: 'Elite Apparel Co',
      });
    authToken = res.body.data.token;
  });

  it('creates a catalog product with initial stock', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Signature Raw Denim Jacket',
        SKU: 'JKT-RAW-01',
        category: 'Apparel',
        sellingPrice: 3499,
        unitCost: 1400,
        stockQuantity: 15,
        active: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product.SKU).toBe('JKT-RAW-01');
    expect(res.body.data.product.stockQuantity).toBe(15);
    productId = res.body.data.product.id;
  });

  it('creates an order linked to the product and decrements stock', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        orderNumber: 'ORD-TEST-9001',
        channel: 'Shopify',
        customer: {
          name: 'Vikram Malhotra',
          email: 'vikram@example.com',
          city: 'Mumbai',
        },
        items: [
          {
            productId,
            nameSnapshot: 'Signature Raw Denim Jacket',
            skuSnapshot: 'JKT-RAW-01',
            quantity: 3,
            unitSalePrice: 3499,
            unitCostSnapshot: 1400,
          },
        ],
        status: 'pending',
        shippingCost: 120,
        shippingChargedToCustomer: 50,
        discountAmount: 200,
        advertisingCost: 150,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    orderId = res.body.data.order.id;
    expect(res.body.data.order.financials).toBeDefined();

    // Verify product stock was decremented from 15 to 12
    const prodRes = await request(app)
      .get(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(prodRes.status).toBe(200);
    expect(prodRes.body.data.product.stockQuantity).toBe(12);
  });

  it('retrieves order details with accurate financial waterfall calculation', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const order = res.body.data.order;
    const f = order.financials;

    // Gross Sales = 3 * 3499 = 10,497
    expect(f.grossMerchandiseSales).toBe(10497);
    // Net Revenue = Gross (10497) - Discount (200) + Shipping Charged (50) = 10,347
    expect(f.netRevenue).toBe(10347);
    // Adjusted COGS = 3 * 1400 = 4,200
    expect(f.adjustedProductCost).toBe(4200);
    // Direct Costs = Shipping (120) + Ad Cost (150) = 270
    // Net Profit = Net Revenue (10347) - COGS (4200) - Direct Costs (270) = 5,877
    expect(f.netProfit).toBe(5877);
    // Profit margin = (5877 / 10347) * 100 = 56.8%
    expect(f.profitMargin).toBe(56.8);
  });

  it('updates order status via PATCH /orders/:id/status', async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'shipped', paymentStatus: 'paid' });

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('shipped');
    expect(res.body.data.order.paymentStatus).toBe('paid');
  });

  it('creates a courier shipment and auto-syncs order status to delivered', async () => {
    const res = await request(app)
      .post('/api/v1/shipments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        orderId,
        courier: 'Delhivery',
        trackingNumber: 'DEL-99201044',
        shippingCost: 120,
        shipmentStatus: 'delivered',
        weightGrams: 850,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    shipmentId = res.body.data.shipment.id;

    // Verify order status synced to delivered
    const ordRes = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(ordRes.body.data.order.status).toBe('delivered');
  });

  it('records an order return with resalable restocked status and restocks inventory', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${orderId}/returns`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        returnedItems: [
          {
            sku: 'JKT-RAW-01',
            name: 'Signature Raw Denim Jacket',
            quantity: 1,
            unitCostSnapshot: 1400,
          },
        ],
        returnReason: 'Wrong size chosen by customer',
        refundAmount: 3499,
        reverseShippingCost: 100,
        returnedCondition: 'resalable',
        inventoryRecoveryStatus: 'restocked',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify product stock incremented back from 12 to 13
    const prodRes = await request(app)
      .get(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(prodRes.body.data.product.stockQuantity).toBe(13);

    // Verify order status transitioned to returned
    const ordRes = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(ordRes.body.data.order.status).toBe('returned');
  });

  it('records an operating expense and lists expenses', async () => {
    const res = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category: 'packaging',
        amount: 850,
        description: 'Premium Eco Bubble Mailers (50 units)',
        date: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.expense.amount).toBe(850);
    expenseId = res.body.data.expense.id;

    const listRes = await request(app)
      .get('/api/v1/expenses')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.expenses.length).toBeGreaterThanOrEqual(1);
  });

  it('retrieves store analytics overview with live margins and alerts', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.totalOrders).toBeGreaterThanOrEqual(1);
    expect(res.body.data.alerts).toBeDefined();
  });

  it('completes the forgot-password and reset-password flow', async () => {
    // 1. Request reset token
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'merchant.e2e@profitpilot.com' });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.demoResetToken).toBeDefined();
    const token = forgotRes.body.demoResetToken;

    // 2. Consume reset token with new password
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token,
        newPassword: 'BrandNewPassword999!',
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // 3. Login with newly set password
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'merchant.e2e@profitpilot.com',
        password: 'BrandNewPassword999!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
  });

  it('updates profile settings via PATCH /settings', async () => {
    const res = await request(app)
      .patch('/api/v1/settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        businessName: 'Elite Denim Labs Pvt Ltd',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.businessName).toBe('Elite Denim Labs Pvt Ltd');
  });
});
