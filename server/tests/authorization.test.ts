import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupMockDb } from './mockDb.js';

describe('Multi-Tenant Seller Authorization & Data Isolation Tests', () => {
  let app: any;
  let sellerAToken: string;
  let sellerBToken: string;
  let sellerAProductId: string;
  let sellerAOrderId: string;

  beforeAll(async () => {
    setupMockDb();
    app = createApp();

    // 1. Register Seller A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Seller A',
        email: 'seller.a@business.com',
        password: 'PasswordA123!',
        businessName: 'Store A',
      });
    sellerAToken = resA.body.data.token;

    // 2. Register Seller B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Seller B',
        email: 'seller.b@business.com',
        password: 'PasswordB123!',
        businessName: 'Store B',
      });
    sellerBToken = resB.body.data.token;

    // 3. Seller A creates a product
    const prodRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${sellerAToken}`)
      .send({
        name: 'Seller A Exclusive Item',
        SKU: 'SELLER-A-SKU-1',
        category: 'Fashion',
        sellingPrice: 1500,
        unitCost: 600,
        stockQuantity: 50,
      });
    sellerAProductId = prodRes.body.data.product.id;

    // 4. Seller A creates an order
    const ordRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${sellerAToken}`)
      .send({
        orderNumber: 'SELLER-A-ORD-001',
        channel: 'website',
        items: [
          {
            nameSnapshot: 'Seller A Exclusive Item',
            skuSnapshot: 'SELLER-A-SKU-1',
            quantity: 2,
            unitSalePrice: 1500,
            unitCostSnapshot: 600,
          },
        ],
        shippingCost: 80,
      });
    sellerAOrderId = ordRes.body.data.order.id;
  });

  it('prevents Seller B from viewing Seller A products in list view', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${sellerBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBe(0);
  });

  it('prevents Seller B from reading Seller A product by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${sellerAProductId}`)
      .set('Authorization', `Bearer ${sellerBToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Product not found');
  });

  it('prevents Seller B from updating Seller A product', async () => {
    const res = await request(app)
      .patch(`/api/v1/products/${sellerAProductId}`)
      .set('Authorization', `Bearer ${sellerBToken}`)
      .send({ name: 'Hacked by Seller B' });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Product not found');
  });

  it('prevents Seller B from deleting Seller A product', async () => {
    const res = await request(app)
      .delete(`/api/v1/products/${sellerAProductId}`)
      .set('Authorization', `Bearer ${sellerBToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Product not found');
  });

  it('prevents Seller B from viewing Seller A orders in list view', async () => {
    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${sellerBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders.length).toBe(0);
  });

  it('prevents Seller B from reading Seller A order by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${sellerAOrderId}`)
      .set('Authorization', `Bearer ${sellerBToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Order not found');
  });

  it('guarantees analytics queries never leak another seller data', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${sellerBToken}`);

    expect(res.status).toBe(200);
    // Seller B has 0 orders and 0 revenue
    expect(res.body.data.summary.totalOrders).toBe(0);
    expect(res.body.data.summary.netRevenue).toBe(0);
    expect(res.body.data.summary.netProfit).toBe(0);
  });
});
