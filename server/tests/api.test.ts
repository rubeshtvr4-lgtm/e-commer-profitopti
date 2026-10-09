import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupMockDb } from './mockDb.js';

describe('API Endpoints, Validation & Exports Tests', () => {
  let app: any;
  let authToken: string;

  beforeAll(async () => {
    setupMockDb();
    app = createApp();

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Demo Admin',
        email: 'demoadmin@teststore.com',
        password: 'AdminPassword123!',
        businessName: 'Admin Store',
      });
    authToken = res.body.data.token;
  });

  it('rejects invalid product creation with Zod validation errors', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '', // Invalid empty name
        SKU: '',
        sellingPrice: -10, // Invalid negative price
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details).toBeDefined();
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('successfully seeds realistic demo store data', async () => {
    const res = await request(app)
      .post('/api/v1/demo/seed')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.productsCount).toBeGreaterThanOrEqual(5);
    expect(res.body.data.ordersCount).toBeGreaterThanOrEqual(10);
  });

  it('retrieves paginated and filtered orders', async () => {
    const res = await request(app)
      .get('/api/v1/orders?page=1&limit=5')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders.length).toBeLessThanOrEqual(5);
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(10);
    expect(res.body.data.orders[0].financials).toBeDefined();
  });

  it('exports orders as valid CSV stream', async () => {
    const res = await request(app)
      .get('/api/v1/reports/orders.csv')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Order Number');
    expect(res.text).toContain('Net Revenue (INR)');
    expect(res.text).toContain('Net Profit (INR)');
  });

  it('exports profitability report as valid CSV stream', async () => {
    const res = await request(app)
      .get('/api/v1/reports/profitability.csv')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('SKU');
    expect(res.text).toContain('Profit Margin (%)');
  });

  it('produces AI insights with deterministic fallback when no LLM key is configured', async () => {
    const res = await request(app)
      .post('/api/v1/ai/insights')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.insights).toBeDefined();
    expect(res.body.data.insights.recommendations.length).toBeGreaterThan(0);
    expect(res.body.data.insights.disclaimer).toBeDefined();
  });

  it('returns health check status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
